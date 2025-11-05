# Company Websites Monorepo

統一管理多個公司網站的 Monorepo，使用 Turborepo + Next.js 16

## 📚 文檔

- **[架構說明](./ARCHITECTURE.md)** - Monorepo 架構、依賴關係、使用場景
- **[部署指南](./DEPLOYMENT.md)** - Vercel 部署、提取專案、常見問題
- **[提取腳本](./scripts/extract-project.sh)** - 自動提取單一專案的腳本

## 專案結構

```
company-websites/
├── apps/                    # 各個網站專案
│   ├── jianlin/            # 建林官網
│   ├── company-a/          # 公司A官網
│   ├── company-b/          # 公司B官網
│   └── company-c/          # 公司C官網
├── packages/                # 共用包
│   ├── api-template/       # 統一的 API 模板
│   ├── ui/                 # 共用 UI 組件
│   └── types/              # 共用 TypeScript 類型
├── package.json
└── turbo.json
```

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
# 運行所有專案
npm run dev

# 只運行特定專案
npm run dev -- --filter=jianlin
```

### 建置

```bash
# 建置所有專案
npm run build

# 建置特定專案
npm run build -- --filter=jianlin
```

### 測試

```bash
# 運行所有測試
npm run test

# 運行特定專案的測試
npm run test -- --filter=jianlin
```

## 使用 API 模板

### 1. 在專案中安裝依賴

`apps/your-project/package.json`:
```json
{
  "dependencies": {
    "@repo/api-template": "*",
    "@repo/types": "*"
  }
}
```

### 2. 建立 API 路由

`apps/your-project/app/api/admin/cases/route.ts`:
```typescript
import { createCasesAPI } from '@repo/api-template/routes/cases';
import { getCases, createCase, updateCase, deleteCase, getCaseById } from '@/lib/data/db';
import { isAdmin } from '@/lib/auth/auth';

// 你的資料來源
const dataSource = {
  getCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase
};

// 使用統一模板
const api = createCasesAPI(dataSource, isAdmin);

export const GET = api.GET;
export const POST = api.POST;
```

## Vercel 部署

每個專案獨立部署到 Vercel:

### 設定

1. 連結 Git Repository 到 Vercel
2. 建立新專案,設定如下:

```
Framework Preset: Next.js
Root Directory: apps/jianlin  (根據專案調整)
Build Command: cd ../.. && npx turbo run build --filter=jianlin
Output Directory: apps/jianlin/.next
Install Command: npm install
```

### 環境變數

從舊專案複製環境變數到新的 Vercel 專案。

## 開發工作流

### 新增功能

1. 如果是共用功能 → 加到 `packages/` 目錄
2. 如果是專案特定功能 → 加到 `apps/[project]` 目錄

### 修改 API 模板

修改 `packages/api-template/` 後,所有使用的專案都會自動受益。

### 新增專案

```bash
cd apps
cp -r jianlin new-project
cd new-project
# 修改 package.json 的 name
# 修改資料來源
```

## 故障排除

### 依賴問題

```bash
# 清除所有 node_modules
npm run clean

# 重新安裝
npm install
```

### 建置問題

```bash
# 清除 turbo 快取
rm -rf .turbo

# 重新建置
npm run build
```

## 貢獻指南

1. 建立功能分支
2. 提交 PR
3. 通過測試後合併

## 授權

Private - 僅供內部使用
