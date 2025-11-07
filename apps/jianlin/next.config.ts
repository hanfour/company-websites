import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // 性能優化配置
  compress: true, // Gzip 壓縮
  poweredByHeader: false, // 隱藏 X-Powered-By 標頭（安全性）

  // Webpack 配置：忽略不需要的原生模組
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false, // 忽略 canvas 模組（來自 @repo/api-template 的 CanvasCaptchaGenerator）
    };
    return config;
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jienlin.s3-ap-northeast-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'd377o53dybsd55.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'company-assets-tw-2025.s3.ap-northeast-1.amazonaws.com',
      },
    ],
    // 圖片優化設定
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 年快取
  },

  // 安全性標頭
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
  async rewrites() {
    return [
      // 公開頁面 - 語意化 URL 重寫
      { source: '/about', destination: '/about_us' },
      { source: '/contact', destination: '/contact_us' },

      // 個案列表 - cases 命名空間
      { source: '/cases/featured', destination: '/hot_list' },
      { source: '/cases/completed', destination: '/history_list' },
      { source: '/cases', destination: '/hot_list' }, // 預設顯示熱銷

      // 個案詳情
      { source: '/cases/featured/:id', destination: '/hot/:id' },
      { source: '/cases/completed/:id', destination: '/history/:id' },

      // 物件列表 - properties 命名空間
      { source: '/properties', destination: '/real_estate_list' },
      { source: '/rentals', destination: '/real_estate_list' }, // 別名

      // 物件詳情
      { source: '/properties/:id', destination: '/real_estate/:id' },
      { source: '/rentals/:id', destination: '/real_estate/:id' }, // 別名

      // 後台 - 語意化 URL 重寫
      { source: '/admin/dashboard', destination: '/admin' },

      // 後台個案管理
      { source: '/admin/cases/featured', destination: '/admin/hot_list' },
      { source: '/admin/cases/featured/new', destination: '/admin/hot/new' },
      { source: '/admin/cases/featured/:id', destination: '/admin/hot/:id' },

      { source: '/admin/cases/completed', destination: '/admin/history_list' },
      { source: '/admin/cases/completed/new', destination: '/admin/history/new' },
      { source: '/admin/cases/completed/:id', destination: '/admin/history/:id' },

      // 後台物件管理
      { source: '/admin/properties', destination: '/admin/real_estate_list' },
      { source: '/admin/properties/new', destination: '/admin/real_estate/new' },
      { source: '/admin/properties/:id', destination: '/admin/real_estate/:id' },
    ];
  },
};

// Injected content via Sentry wizard below

// ⚠️ Sentry 暫時停用
// 原因：專案名稱配置錯誤 (Project not found: javascript-nextjs)
// 如需啟用：
// 1. 前往 https://sentry.io/organizations/hanfourhuang/projects/
// 2. 確認正確的專案 slug
// 3. 更新下方 project 欄位
// 4. 取消此註解
export default nextConfig;

/*
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      // For all available options, see:
      // https://github.com/getsentry/sentry-webpack-plugin#options

      org: "hanfourhuang",
      project: "javascript-nextjs",

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      // For all available options, see:
      // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

      // Upload a larger set of source maps for prettier stack traces (increases build time)
      widenClientFileUpload: true,

      // Automatically annotate React components to show their full name in breadcrumbs and session replay
      reactComponentAnnotation: {
        enabled: true,
      },

      // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
      // This can increase your server load as well as your hosting bill.
      // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
      // side errors will fail.
      tunnelRoute: "/monitoring",

      // Configure source maps
      sourcemaps: {
        disable: false,
      },

      // Automatically tree-shake Sentry logger statements to reduce bundle size
      disableLogger: true,

      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    })
  : nextConfig;
*/
