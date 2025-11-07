'use client';

import { useEffect, useState } from 'react';
import Carousel from '@/components/ui/Carousel';

// 清晰的配置，不是魔法数字
const SCROLL_CONFIG = {
  THRESHOLD: 200, // 滚动200px完成过渡，更丝滑
  INITIAL_GAP: 4.166667, // 1/24 = 4.166667%
} as const;

interface HeroSectionProps {
  carousel: any[];
}

export default function HeroSection({ carousel }: HeroSectionProps) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      // 简单的线性插值，不需要复杂逻辑
      const progress = Math.min(window.scrollY / SCROLL_CONFIG.THRESHOLD, 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 计算当前间距：从 4.166667% 到 0%
  const currentGap = `${SCROLL_CONFIG.INITIAL_GAP * (1 - scrollProgress)}%`;

  return (
    <div className="flex w-full h-[calc(100vh-48px)] md:h-[calc(100vh-72px)]">
      {/* 左侧间距 */}
      <div
        style={{
          width: currentGap,
          transition: 'width 0.3s ease-out',
        }}
        className="hidden md:block shrink-0"
      />

      <div className="flex-1 h-full bg-gray-light">
        {carousel.length > 0 && <Carousel items={carousel} />}
      </div>

      {/* 右侧 SCROLL DOWN + 间距 */}
      <div
        style={{
          width: currentGap,
          opacity: 1 - scrollProgress,
          transition: 'width 0.3s ease-out, opacity 0.3s ease-out',
        }}
        className="hidden md:flex shrink-0"
      >
        <a
          href="#more"
          className="flex w-full flex-col justify-end items-center text-gray-600 no-underline cursor-pointer pb-8"
        >
          <span className="writing-mode-vertical-rl">SCROLL DOWN</span>
          <span className="w-px h-32 bg-gray-400 mt-4"></span>
        </a>
      </div>
    </div>
  );
}
