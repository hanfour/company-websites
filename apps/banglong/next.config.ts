import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 性能优化配置
  compress: true, // Gzip 压缩
  poweredByHeader: false, // 隐藏 X-Powered-By 标头（安全性）

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ww2sb1ry85zp8ul0.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'company-assets-tw-2025.s3.ap-northeast-1.amazonaws.com',
      },
    ],
    // 图片优化设置
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 年缓存
  },

  // 安全性标头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
