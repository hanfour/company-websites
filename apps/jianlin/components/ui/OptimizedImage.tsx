'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  priority = false,
  fill = false,
  width,
  height,
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // 如果是外部 URL，使用 img 標籤
  const isExternal = src.startsWith('http://') || src.startsWith('https://');

  // 將 objectFit prop 轉換為 Tailwind 類
  const objectFitClass = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  }[objectFit];

  if (error) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <span className="text-gray-500 text-sm">圖片載入失敗</span>
      </div>
    );
  }

  if (isExternal) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${className} ${objectFitClass} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    );
  }

  // 使用 Next.js Image 組件進行優化
  return (
    <Image
      src={src}
      alt={alt}
      className={`${className} ${objectFitClass} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`}
      priority={priority}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={() => setIsLoading(false)}
      onError={() => setError(true)}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
    />
  );
}
