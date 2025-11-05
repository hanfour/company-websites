'use client';

import { useState, useRef } from 'react';
import type { ImageItem } from '@/types';

interface MultiImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function MultiImageUploader({
  images,
  onChange,
  maxImages = 20,
  disabled = false,
}: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // 檢查數量限制
    if (images.length + files.length > maxImages) {
      setError(`最多只能上傳 ${maxImages} 張圖片`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    // 驗證所有檔案
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!allowedTypes.includes(file.type)) {
        setError(`檔案 "${file.name}" 格式不支援，僅支援：JPEG、PNG、GIF、WebP`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (file.size > maxSize) {
        setError(`檔案 "${file.name}" 大小超過 10MB`);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
    }

    setError('');
    setUploading(true);

    try {
      const uploadedImages: ImageItem[] = [];

      // 逐個上傳檔案
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileKey = `${file.name}-${Date.now()}-${i}`;

        try {
          // 更新進度
          setUploadProgress(prev => ({ ...prev, [fileKey]: 10 }));

          // 步驟 1: 取得預簽名 URL
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
          setUploadProgress(prev => ({ ...prev, [fileKey]: 30 }));

          // 步驟 2: 上傳到 S3
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

          setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }));

          // 新增到已上傳列表
          uploadedImages.push({
            name: file.name,
            src: key,
            location: publicUrl,
          });

        } catch (error) {
          console.error(`Upload error for ${file.name}:`, error);
          setError(`檔案 "${file.name}" 上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
          // 繼續上傳其他檔案
        }
      }

      // 更新圖片列表
      if (uploadedImages.length > 0) {
        onChange([...images, ...uploadedImages]);
      }

    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : '上傳失敗');
    } finally {
      setUploading(false);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    onChange(newImages);
  };

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    onChange(newImages);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
          <button
            onClick={() => setError('')}
            className="ml-2 text-red-900 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* 上傳按鈕 */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          multiple
          className="hidden"
          disabled={disabled || uploading || images.length >= maxImages}
        />
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={disabled || uploading || images.length >= maxImages}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? '上傳中...' : '選擇圖片'}
        </button>
        <p className="text-sm text-gray-500">
          已上傳 {images.length} / {maxImages} 張 · 支援格式：JPEG、PNG、GIF、WebP（最大 10MB）
        </p>
      </div>

      {/* 上傳進度 */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm text-blue-900 mb-2">正在上傳...</div>
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="mb-2">
              <div className="w-full h-2 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 圖片列表 */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
            >
              {/* 圖片預覽 */}
              <div className="aspect-video w-full">
                <img
                  src={image.location}
                  alt={image.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                  }}
                />
              </div>

              {/* 操作按鈕 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {/* 上移 */}
                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="上移"
                >
                  ↑
                </button>
                {/* 下移 */}
                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === images.length - 1}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="下移"
                >
                  ↓
                </button>
                {/* 刪除 */}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-red-600 rounded-full text-white hover:bg-red-700"
                  title="刪除"
                >
                  ✕
                </button>
              </div>

              {/* 圖片名稱 */}
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                {image.name}
              </div>

              {/* 序號標識 */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                #{index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 空狀態 */}
      {images.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
          <p className="mb-2">尚未上傳任何圖片</p>
          <p className="text-sm">點擊上方按鈕選擇圖片</p>
        </div>
      )}
    </div>
  );
}
