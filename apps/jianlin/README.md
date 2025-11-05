# 建林工業股份有限公司 - 官方網站

這是建林工業股份有限公司的官方網站，使用 [Next.js 15](https://nextjs.org) 框架開發。

## 功能特色

- ✅ **完整的前後台系統**
  - 前台：首頁、關於建林、熱銷個案、歷年個案、不動產租售、聯絡我們
  - 後台：內容管理系統 (CMS)

- ✅ **富文本編輯器**
  - 使用 Tiptap 編輯器進行內容編輯
  - 支援格式化文本、標題、列表等功能

- ✅ **錯誤追蹤與監控**
  - 整合 Sentry 進行錯誤追蹤
  - Session Replay 功能
  - Performance Monitoring

## 技術棧

- **框架**: Next.js 15 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **編輯器**: Tiptap
- **錯誤追蹤**: Sentry
- **部署**: Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Sentry 設定

本專案已整合 Sentry 進行錯誤追蹤與效能監控。請參考 [SENTRY_SETUP.md](./SENTRY_SETUP.md) 進行完整設定。

### 快速設定步驟

1. 從 [Sentry 專案設定](https://sentry.io/settings/hanfourhuang/projects/javascript-nextjs/keys/) 獲取 DSN
2. 從 [Auth Tokens 頁面](https://sentry.io/settings/account/api/auth-tokens/) 創建 Auth Token
3. 在 `.env.local` 中設定環境變數：
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
   SENTRY_AUTH_TOKEN=your_token_here
   ```
4. 訪問 `/sentry-example-page` 測試錯誤追蹤功能

詳細說明請參考 [SENTRY_SETUP.md](./SENTRY_SETUP.md)。

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
