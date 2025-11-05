'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';

interface Point {
  x: number;
  y: number;
}

interface Area {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface EnhancedImageUploaderProps {
  onUploadSuccess: (result: { publicUrl: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  disabled?: boolean;
  maxImages?: number; // 支持多圖上傳
  enableCrop?: boolean; // 是否啟用裁切
  aspectRatio?: number; // 裁切比例（例如 16/9, 1, 4/3）
}

interface UploadedImage {
  url: string;
  key: string;
  name: string;
  size: number;
  uploadedAt: Date;
}

export default function EnhancedImageUploader({
  onUploadSuccess,
  onUploadError,
  currentImageUrl,
  disabled = false,
  maxImages = 1,
  enableCrop = true,
  aspectRatio = 16 / 9,
}: EnhancedImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 拖拽處理
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  // 處理檔案選擇
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  // 驗證和處理檔案
  const processFile = async (file: File) => {
    // 驗證檔案類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      const errorMsg = '不支援的檔案格式，僅支援：JPEG、PNG、GIF、WebP';
      onUploadError?.(errorMsg);
      return;
    }

    // 驗證檔案大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const errorMsg = '檔案大小超過 10MB';
      onUploadError?.(errorMsg);
      return;
    }

    setOriginalFile(file);

    // 建立本地預覽
    const localPreviewUrl = URL.createObjectURL(file);

    if (enableCrop) {
      // 進入裁切模式
      setImageToCrop(localPreviewUrl);
      setShowCropper(true);
    } else {
      // 直接上傳
      await uploadFile(file, localPreviewUrl);
    }
  };

  // 裁切完成回調
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 應用裁切並上傳
  const handleCropConfirm = async () => {
    if (!originalFile || !croppedAreaPixels) return;

    try {
      // 創建裁切後的圖片
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: originalFile.type,
      });

      setShowCropper(false);
      setImageToCrop('');

      // 上傳裁切後的圖片
      const localPreviewUrl = URL.createObjectURL(croppedFile);
      await uploadFile(croppedFile, localPreviewUrl);
    } catch (error) {
      console.error('裁切失敗:', error);
      onUploadError?.('圖片裁切失敗');
      setShowCropper(false);
    }
  };

  // 取消裁切
  const handleCropCancel = () => {
    setShowCropper(false);
    setImageToCrop('');
    URL.revokeObjectURL(imageToCrop);
    setOriginalFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 上傳檔案
  const uploadFile = async (file: File, localPreviewUrl: string) => {
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
      {/* 裁切模態框 */}
      {showCropper && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* 裁切器頭部 */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">裁切圖片</h3>
              <p className="text-sm text-gray-600 mt-1">
                調整圖片位置和縮放，然後點擊確認
              </p>
            </div>

            {/* 裁切器主體 */}
            <div className="relative h-96 bg-gray-900">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* 縮放控制 */}
            <div className="p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                縮放
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* 裁切器底部按鈕 */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleCropConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                確認裁切
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 預覽區域 */}
      {previewUrl && (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
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

      {/* 拖拽上傳區域 */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50'}
        `}
        onClick={!disabled && !uploading ? handleButtonClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />

        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-sm font-medium text-gray-700">
              {isDragging ? '放開以上傳圖片' : '拖拽圖片到此處或點擊選擇'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支援格式：JPEG、PNG、GIF、WebP（最大 10MB）
            </p>
            {enableCrop && (
              <p className="text-xs text-blue-600 mt-1">
                上傳後可進行裁切調整
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick();
            }}
            disabled={disabled || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? '上傳中...' : previewUrl ? '更換圖片' : '選擇圖片'}
          </button>
        </div>
      </div>
    </div>
  );
}

// 裁切圖片的輔助函數
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('無法創建 canvas context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas 轉換為 Blob 失敗'));
      }
    }, 'image/jpeg', 0.95);
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });
}
