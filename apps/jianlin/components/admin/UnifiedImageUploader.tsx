'use client';

import { useState } from 'react';
import EnhancedImageUploader from './EnhancedImageUploader';
import ImageGallery from './ImageGallery';

interface UnifiedImageUploaderProps {
  onUploadSuccess: (result: { publicUrl: string; key: string }) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  currentImageKey?: string;
  disabled?: boolean;
  enableCrop?: boolean;
  aspectRatio?: number;
}

export default function UnifiedImageUploader({
  onUploadSuccess,
  onUploadError,
  currentImageUrl,
  currentImageKey,
  disabled = false,
  enableCrop = true,
  aspectRatio = 16 / 9,
}: UnifiedImageUploaderProps) {
  const [showGallery, setShowGallery] = useState(false);

  const handleGallerySelect = (url: string, key: string) => {
    onUploadSuccess({ publicUrl: url, key });
  };

  return (
    <div className="space-y-4">
      {/* 標籤頁切換 */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex gap-4">
          <button
            type="button"
            className="pb-2 px-1 text-sm font-medium text-blue-600 border-b-2 border-blue-600"
          >
            上傳新圖片
          </button>
          <button
            type="button"
            onClick={() => setShowGallery(true)}
            className="pb-2 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            從圖片庫選擇
          </button>
        </div>
      </div>

      {/* 增強版上傳器 */}
      <EnhancedImageUploader
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        currentImageUrl={currentImageUrl}
        disabled={disabled}
        enableCrop={enableCrop}
        aspectRatio={aspectRatio}
      />

      {/* 圖片庫模態框 */}
      {showGallery && (
        <ImageGallery
          onSelectImage={handleGallerySelect}
          onClose={() => setShowGallery(false)}
          currentImageKey={currentImageKey}
        />
      )}
    </div>
  );
}
