# Monorepo 統一 API 架構方案

## 概述

使用 Turborepo 建立 monorepo,讓 4 個專案共用 API 模板和組件,但保持資料獨立。

## 架構設計

```
┌─────────────────────────────────────────────────────────────┐
│                    Turborepo Monorepo                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  apps/                                                       │
│  ├── jianlin/                                               │
│  │   ├── app/api/         (使用 @repo/api-template)        │
│  │   ├── lib/data/        (建林的資料: case.json)          │
│  │   └── components/      (使用 @repo/ui)                  │
│  │                                                           │
│  ├── company-a/                                             │
│  │   ├── app/api/         (使用 @repo/api-template)        │
│  │   ├── lib/data/        (公司A的資料)                    │
│  │   └── components/      (使用 @repo/ui)                  │
│  │                                                           │
│  ├── company-b/           (同上)                            │
│  └── company-c/           (同上)                            │
│                                                              │
│  packages/                                                   │
│  ├── api-template/        ← 統一的 API 介面                │
│  │   ├── routes/                                            │
│  │   │   ├── cases.ts    (建案 CRUD)                       │
│  │   │   ├── rentals.ts  (租售 CRUD)                       │
│  │   │   └── carousel.ts (輪播圖 CRUD)                     │
│  │   ├── middleware/                                        │
│  │   │   ├── auth.ts     (認證中間件)                      │
│  │   │   └── error.ts    (錯誤處理)                        │
│  │   └── utils/                                             │
│  │       └── db.ts       (資料庫操作抽象)                  │
│  │                                                           │
│  ├── ui/                  ← 共用 UI 組件                    │
│  │   ├── Carousel.tsx                                       │
│  │   ├── ImageGallery.tsx                                   │
│  │   └── ...                                                │
│  │                                                           │
│  └── types/               ← 共用 TypeScript 類型            │
│      ├── case.ts                                            │
│      ├── rental.ts                                          │
│      └── ...                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘

部署:
- jianlin.com        → Vercel (獨立部署)
- company-a.com      → Vercel (獨立部署)
- company-b.com      → Vercel (獨立部署)
- company-c.com      → Vercel (獨立部署)
```

## 成本分析

| 項目 | 費用 | 說明 |
|------|------|------|
| Vercel Hobby (4個專案) | $0 | 每個專案免費部署 |
| 域名 (4個) | ~$40/年 | 每個 $10/年 |
| **總計** | **$0/月** | **遠低於 $20 預算** |

如果需要更多功能:
- Vercel Pro (1個團隊帳號) | $20/月 | 可部署無限專案

## 快速開始

### 1. 建立 Monorepo

```bash
# 安裝 Turborepo
npx create-turbo@latest

# 或手動設置
mkdir company-projects
cd company-projects
npm init -y
npm install turbo -D
```

### 2. 專案結構

**根目錄 package.json**
```json
{
  "name": "company-projects",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 3. 建立共用 API 模板包

**packages/api-template/package.json**
```json
{
  "name": "@repo/api-template",
  "version": "1.0.0",
  "main": "./index.ts",
  "types": "./index.ts",
  "dependencies": {
    "next": "^16.0.1"
  }
}
```

**packages/api-template/routes/cases.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import type { CaseItem } from '@repo/types';

// 這是模板,每個專案會覆寫 getDataSource
export interface DataSource {
  getCases(): Promise<CaseItem[]>;
  createCase(data: CaseItem): Promise<boolean>;
  updateCase(id: string, data: Partial<CaseItem>): Promise<boolean>;
  deleteCase(id: string): Promise<boolean>;
}

export function createCasesAPI(dataSource: DataSource) {
  return {
    async GET() {
      try {
        const cases = await dataSource.getCases();
        return NextResponse.json({ items: cases }, { status: 200 });
      } catch (error) {
        console.error('Get cases error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    },

    async POST(request: NextRequest) {
      try {
        const data: CaseItem = await request.json();

        if (!data.numberID || !data.name || !data.type) {
          return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
        }

        const success = await dataSource.createCase(data);
        if (!success) {
          return NextResponse.json({ error: 'CREATE_FAILED' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
      } catch (error) {
        console.error('Create case error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    }
  };
}
```

**packages/api-template/middleware/auth.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export interface AuthConfig {
  isAdmin: () => Promise<boolean>;
}

export function withAuth(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: AuthConfig
) {
  return async (req: NextRequest) => {
    const admin = await config.isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }
    return handler(req);
  };
}
```

### 4. 在各專案中使用

**apps/jianlin/app/api/admin/cases/route.ts**
```typescript
import { createCasesAPI } from '@repo/api-template/routes/cases';
import { getCases, createCase, updateCase, deleteCase } from '@/lib/data/db';

// 建林專案的資料來源
const dataSource = {
  getCases,
  createCase,
  updateCase,
  deleteCase
};

// 使用共用模板建立 API
const api = createCasesAPI(dataSource);

export const GET = api.GET;
export const POST = api.POST;
```

**apps/company-a/app/api/admin/cases/route.ts**
```typescript
import { createCasesAPI } from '@repo/api-template/routes/cases';
import { getCases, createCase, updateCase, deleteCase } from '@/lib/data/db';

// 公司A的資料來源 (不同的資料庫)
const dataSource = {
  getCases,
  createCase,
  updateCase,
  deleteCase
};

// 使用相同的 API 模板
const api = createCasesAPI(dataSource);

export const GET = api.GET;
export const POST = api.POST;
```

### 5. 共用 UI 組件

**packages/ui/Carousel.tsx**
```typescript
'use client';

import { useState } from 'react';
import type { CarouselItem } from '@repo/types';

export function Carousel({ items }: { items: CarouselItem[] }) {
  const [current, setCurrent] = useState(0);

  // 共用的 Carousel 邏輯
  return (
    <div className="carousel">
      {/* ... */}
    </div>
  );
}
```

**在各專案使用**
```typescript
// apps/jianlin/app/page.tsx
import { Carousel } from '@repo/ui/Carousel';

export default function Home() {
  return <Carousel items={carouselItems} />;
}
```

### 6. 開發流程

```bash
# 開發所有專案 (同時運行)
npm run dev

# 只開發建林專案
cd apps/jianlin
npm run dev

# 建置所有專案
npm run build

# 測試所有專案
npm run test
```

## 部署策略

### 選項 A: Vercel (推薦)

每個專案獨立部署:

```bash
# 建林專案
cd apps/jianlin
vercel

# 公司A專案
cd apps/company-a
vercel
```

**Vercel 設定**
```json
// apps/jianlin/vercel.json
{
  "buildCommand": "cd ../.. && turbo run build --filter=jianlin",
  "outputDirectory": ".next"
}
```

### 選項 B: GitHub Actions 自動部署

**.github/workflows/deploy.yml**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-jianlin:
    if: contains(github.event.head_commit.modified, 'apps/jianlin')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx turbo run build --filter=jianlin
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID_JIANLIN }}
          working-directory: ./apps/jianlin

  deploy-company-a:
    if: contains(github.event.head_commit.modified, 'apps/company-a')
    runs-on: ubuntu-latest
    steps:
      # 同上,但部署 company-a
```

## 遷移計畫

### 階段 1: 設置 Monorepo (1天)

1. 建立 monorepo 結構
2. 移動現有 jianlin 專案到 `apps/jianlin`
3. 提取共用代碼到 `packages/`

### 階段 2: 建立 API 模板 (2-3天)

1. 從 jianlin 專案提取 API 邏輯
2. 建立 `@repo/api-template` 包
3. 在 jianlin 專案中測試

### 階段 3: 遷移其他專案 (1天/專案)

1. 建立新專案目錄
2. 使用 API 模板
3. 客製化資料來源
4. 測試部署

### 階段 4: 共用 UI 組件 (持續)

隨著開發,逐步提取共用組件到 `@repo/ui`

## 優勢總結

| 特性 | Monorepo | AWS API Gateway |
|------|----------|-----------------|
| **統一 API 介面** | ✅ 模板化 | ✅ 統一端點 |
| **資料獨立** | ✅ 每個專案獨立 | ❌ 需要多租戶邏輯 |
| **成本** | ✅ $0/月 | ❌ $20-50/月 |
| **複雜度** | ✅ 低 | ❌ 高 |
| **學習曲線** | ✅ Next.js 即可 | ❌ 需學 AWS |
| **部署** | ✅ Vercel 一鍵 | ❌ 需要 IaC |
| **程式碼共用** | ✅ 原生支援 | ❌ 需要額外工具 |
| **本地開發** | ✅ 簡單 | ❌ 需要模擬 |
| **團隊規模** | ✅ 1-2人可管理 | ❌ 需要專職 DevOps |

## 下一步

1. 決定是否採用此方案
2. 設置 Monorepo 結構
3. 遷移現有專案
4. 建立 API 模板
5. 逐步遷移其他專案

## 參考資源

- [Turborepo 官方文檔](https://turbo.build/repo/docs)
- [Vercel Monorepo 部署](https://vercel.com/docs/monorepos)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
