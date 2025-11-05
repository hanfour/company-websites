'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/utils/image';
import type { ImageItem } from '@/types';

interface ImageGalleryProps {
  images: ImageItem[];
  projectName: string;
}

export default function ImageGallery({ images, projectName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[activeIndex];
  const imageUrl = getImageUrl(currentImage, CDN_LINK);

  return (
    <div className="w-full">
      {/* 大图显示 */}
      <div className="w-full pb-[75%] bg-gray-light relative overflow-hidden mb-4">
        <div
          className="absolute inset-0 bg-fluid bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </div>

      {/* 缩略图列表 */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3">
          {images.map((img, idx) => {
            const thumbUrl = getImageUrl(img, CDN_LINK);
            return (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`relative pb-[75%] overflow-hidden cursor-pointer transition-all duration-300 ${
                  idx === activeIndex
                    ? 'ring-2 ring-main opacity-100'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <div
                  className="absolute inset-0 bg-fluid bg-cover bg-center"
                  style={{ backgroundImage: `url(${thumbUrl})` }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
