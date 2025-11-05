'use client';

import { useState, useRef } from 'react';

interface DocumentUploaderProps {
  onUploadSuccess: (result: { publicUrl: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  currentDocumentUrl?: string;
  disabled?: boolean;
}

interface UploadPart {
  PartNumber: number;
  ETag: string;
}

export default function DocumentUploader({
  onUploadSuccess,
  onUploadError,
  currentDocumentUrl,
  disabled = false,
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string>(currentDocumentUrl || '');
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 分片上傳大檔案
   */
  const uploadFileInChunks = async (file: File) => {
    try {
      setUploadStatus('初始化上傳...');
      setProgress(0);

      // 步驟 1：初始化 Multipart Upload
      const initResponse = await fetch('/api/admin/upload/multipart/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!initResponse.ok) {
        const errorData = await initResponse.json();
        throw new Error(errorData.message || '初始化上傳失敗');
      }

      const { uploadId, key, chunkSize, totalParts, publicUrl } = await initResponse.json();
      setProgress(5);

      // 步驟 2：取得所有分片的預簽名 URL
      setUploadStatus(`準備上傳 ${totalParts} 個分片...`);
      const partsResponse = await fetch('/api/admin/upload/multipart/parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId, totalParts }),
      });

      if (!partsResponse.ok) {
        throw new Error('取得上傳 URL 失敗');
      }

      const { parts: partUrls } = await partsResponse.json();
      setProgress(10);

      // 步驟 3：逐一上傳每個分片
      const uploadedParts: UploadPart[] = [];
      abortControllerRef.current = new AbortController();

      for (let i = 0; i < totalParts; i++) {
        const partNumber = i + 1;
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        setUploadStatus(`上傳分片 ${partNumber}/${totalParts}...`);

        const uploadUrl = partUrls[i].uploadUrl;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: chunk,
          signal: abortControllerRef.current.signal,
        });

        if (!uploadResponse.ok) {
          throw new Error(`分片 ${partNumber} 上傳失敗`);
        }

        // 取得 ETag（S3 要求）
        const etag = uploadResponse.headers.get('ETag');
        if (!etag) {
          throw new Error(`分片 ${partNumber} 缺少 ETag`);
        }

        uploadedParts.push({
          PartNumber: partNumber,
          ETag: etag,
        });

        // 更新進度（10% - 90%）
        const uploadProgress = 10 + Math.floor((i + 1) / totalParts * 80);
        setProgress(uploadProgress);
      }

      // 步驟 4：完成 Multipart Upload
      setUploadStatus('完成上傳...');
      const completeResponse = await fetch('/api/admin/upload/multipart/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, uploadId, parts: uploadedParts }),
      });

      if (!completeResponse.ok) {
        throw new Error('完成上傳失敗');
      }

      setProgress(100);
      setUploadStatus('上傳成功！');
      setFileName(file.name);

      // 通知父組件
      onUploadSuccess({ publicUrl, key });
    } catch (error: any) {
      console.error('Upload error:', error);
      if (error.name === 'AbortError') {
        setUploadStatus('上傳已取消');
      } else {
        const errorMsg = error instanceof Error ? error.message : '上傳失敗';
        setUploadStatus(`錯誤: ${errorMsg}`);
        onUploadError?.(errorMsg);
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 驗證檔案類型
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (!allowedTypes.includes(file.type)) {
      const errorMsg = '不支援的檔案格式';
      setUploadStatus(errorMsg);
      onUploadError?.(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 驗證檔案大小（250MB）
    const maxSize = 250 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = '檔案大小超過 250MB';
      setUploadStatus(errorMsg);
      onUploadError?.(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    await uploadFileInChunks(file);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 檔案資訊 */}
      {fileName && (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              {uploadStatus && (
                <p className="text-xs text-gray-500">{uploadStatus}</p>
              )}
            </div>
          </div>

          {/* 進度條 */}
          {uploading && (
            <div className="mt-3">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-600">
                <span>{progress}%</span>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="text-red-500 hover:text-red-700"
                >
                  取消上傳
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 上傳按鈕 */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '上傳中...' : fileName ? '更換文件' : '選擇文件'}
        </button>
        <p className="text-sm text-gray-500">
          支援：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP（最大 250MB）
        </p>
      </div>
    </div>
  );
}
