'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/image';
import type { CarouselItem } from '@/types';

interface CarouselProps {
  items: CarouselItem[];
  showSeeMore?: boolean;
  showCaption?: boolean;
}

export default function Carousel({ items, showSeeMore = false, showCaption = false }: CarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  const next = () => {
    if (animating) return;
    const nextIndex = activeIndex === items.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(nextIndex);
  };

  const previous = () => {
    if (animating) return;
    const nextIndex = activeIndex === 0 ? items.length - 1 : activeIndex - 1;
    setActiveIndex(nextIndex);
  };

  // 自動輪播
  useEffect(() => {
    const interval = setInterval(() => {
      next();
    }, 5000);

    return () => clearInterval(interval);
  }, [activeIndex, items.length]);

  if (!items || items.length === 0) {
    return (
      <div className="w-full h-full bg-gray-light flex items-center justify-center">
        <p className="text-gray-500">無輪播圖片</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {items.map((item, idx) => {
        const imageUrl = getImageUrl(item, CDN_LINK);
        // Debug: 檢查圖片 URL
        if (idx === 0) {
          console.log('[Carousel] First item:', { item, imageUrl });
        }

        return (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-500 ${
              idx === activeIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            onTransitionStart={() => setAnimating(true)}
            onTransitionEnd={() => setAnimating(false)}
          >
            {item.link ? (
              <Link href={item.link} className="block w-full h-full">
                <div
                  className="w-full h-full bg-fluid"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                  title={item.altText}
                />
              </Link>
            ) : (
              <div
                className="w-full h-full bg-fluid"
                style={{ backgroundImage: `url(${imageUrl})` }}
                title={item.altText}
              />
            )}

            {/* See More 按鈕 - 在轮播图右下角，白色覆盖层样式 */}
            {showSeeMore && item.link && idx === activeIndex && (
              <div className="absolute bottom-8 right-8 z-30">
                <Link
                  href={item.link}
                  className="btn-seeMore btn-seeMore-overlay"
                >
                  <div className="line-horizontal"></div>
                  <span className="text">see more</span>
                  <span>&gt;</span>
                </Link>
              </div>
            )}

            {/* Caption - 在详情页显示 altText */}
            {showCaption && item.altText && idx === activeIndex && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-6 py-3 rounded z-20">
                <p className="text-sm md:text-base text-center">{item.altText}</p>
              </div>
            )}
          </div>
        );
      })}

      {/* 指示器 (隱藏) */}
      <div className="hidden absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {items.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full ${
              idx === activeIndex ? 'bg-white' : 'bg-gray-400'
            }`}
            onClick={() => !animating && setActiveIndex(idx)}
          />
        ))}
      </div>

      {/* 控制按鈕 (隱藏) */}
      <button
        className="hidden absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full z-20"
        onClick={previous}
      >
        ‹
      </button>
      <button
        className="hidden absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full z-20"
        onClick={next}
      >
        ›
      </button>
    </div>
  );
}
