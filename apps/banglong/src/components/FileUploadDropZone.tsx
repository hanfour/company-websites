'use client';

import { useState, useRef } from 'react';
import { useChunkedUpload, UploadProgress } from '@/lib/hooks/useChunkedUpload';

interface FileUploadDropZoneProps {
  onFilesUploaded: (urls: (string | null)[]) => void;
  maxFileSize?: number; // 字節，預設無限制
  acceptedTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
}

export function FileUploadDropZone({
  onFilesUploaded,
  maxFileSize,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
  multiple = true,
  disabled = false,
}: FileUploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultipleFiles, progress, uploading } = useChunkedUpload();
  const [errors, setErrors] = useState<string[]>([]);

  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const validFiles: File[] = [];
    const errorMessages: string[] = [];

    files.forEach((file) => {
      // 檢查文件大小
      if (maxFileSize && file.size > maxFileSize) {
        errorMessages.push(
          `檔案 "${file.name}" 過大（最大 ${formatBytes(maxFileSize)}）`
        );
        return;
      }

      // 檢查文件類型
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(ext)) {
        errorMessages.push(
          `檔案 "${file.name}" 格式不支持（允許：${acceptedTypes.join(', ')}）`
        );
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, errors: errorMessages };
  };

  const handleFiles = async (files: File[]) => {
    const { valid, errors } = validateFiles(files);

    if (errors.length > 0) {
      setErrors(errors);
      return;
    }

    setErrors([]);

    try {
      const urls = await uploadMultipleFiles(valid);
      onFilesUploaded(urls);
    } catch (error) {
      setErrors([
        error instanceof Error ? error.message : '上傳失敗',
      ]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const selectedFiles = multiple ? files : [files[0]];
    handleFiles(selectedFiles);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {/* 拖放區域 */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleInputChange}
          multiple={multiple}
          disabled={disabled || uploading}
          className="hidden"
          accept={acceptedTypes.join(',')}
        />

        <div className="space-y-2">
          <div className="text-lg font-medium text-gray-700">
            {uploading ? '上傳中...' : '拖放檔案或點擊選擇'}
          </div>
          <p className="text-sm text-gray-500">
            支持格式：{acceptedTypes.join(', ')}
            {maxFileSize && ` | 最大檔案：${formatBytes(maxFileSize)}`}
          </p>
        </div>
      </div>

      {/* 錯誤提示 */}
      {errors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm font-medium text-red-800 mb-2">上傳錯誤：</div>
          <ul className="space-y-1 text-sm text-red-600">
            {errors.map((error, idx) => (
              <li key={idx}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 上傳進度 */}
      {Object.entries(progress).length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="text-sm font-medium text-gray-700">上傳進度：</div>
          {Object.entries(progress).map(([fileName, fileProgress]) => (
            <UploadProgressBar key={fileName} progress={fileProgress} />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadProgressBar({ progress }: { progress: UploadProgress }) {
  const statusColor = {
    idle: 'bg-gray-200',
    uploading: 'bg-blue-500',
    completing: 'bg-yellow-500',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusText = {
    idle: '準備上傳',
    uploading: `上傳中 (${progress.uploadedChunks}/${progress.totalChunks})`,
    completing: '完成上傳中',
    completed: '已完成',
    error: '上傳失敗',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {progress.fileName}
          </p>
          <p className="text-xs text-gray-500">
            {statusText[progress.status]}
          </p>
        </div>
        <div className="text-sm font-medium text-gray-600 ml-4">
          {progress.percentComplete}%
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${statusColor[progress.status]}`}
          style={{ width: `${progress.percentComplete}%` }}
        />
      </div>

      {progress.error && (
        <p className="text-xs text-red-600 mt-2">{progress.error}</p>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
