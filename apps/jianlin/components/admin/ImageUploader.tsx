'use client';

import { useState, useRef } from 'react';

interface ImageUploaderProps {
  onUploadSuccess: (result: { publicUrl: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  disabled?: boolean;
}

export default function ImageUploader({
  onUploadSuccess,
  onUploadError,
  currentImageUrl,
  disabled = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = '不支援的檔案格式，僅支援：JPEG、PNG、GIF、WebP';
      onUploadError?.(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 驗證檔案大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = '檔案大小超過 10MB';
      onUploadError?.(errorMsg);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 建立本地預覽
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    try {
      setUploading(true);
      setProgress(10);

      // 步驟 1：取得預簽名 URL
      const presignResponse = await fetch('/api/admin/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
        }),
      });

      if (!presignResponse.ok) {
        const errorData = await presignResponse.json();
        throw new Error(errorData.message || '取得上傳 URL 失敗');
      }

      const { uploadUrl, publicUrl, key } = await presignResponse.json();
      setProgress(30);

      // 步驟 2：直接上傳到 S3
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('上傳失敗，請稍後再試');
      }

      setProgress(100);

      // 釋放本地預覽 URL
      URL.revokeObjectURL(localPreviewUrl);

      // 使用 S3 的公開 URL 作為預覽
      setPreviewUrl(publicUrl);

      // 通知父組件上傳成功
      onUploadSuccess({ publicUrl, key });
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error instanceof Error ? error.message : '上傳失敗';
      onUploadError?.(errorMsg);

      // 恢復原有圖片或清空預覽
      setPreviewUrl(currentImageUrl || '');
      URL.revokeObjectURL(localPreviewUrl);
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 預覽區域 */}
      {previewUrl && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="預覽"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
            }}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="mb-2">上傳中...</div>
                <div className="w-48 h-2 bg-gray-300 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 text-sm">{progress}%</div>
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
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '上傳中...' : previewUrl ? '更換圖片' : '選擇圖片'}
        </button>
        <p className="text-sm text-gray-500">
          支援格式：JPEG、PNG、GIF、WebP（最大 10MB）
        </p>
      </div>
    </div>
  );
}
