# 環境變數清理指南

## 目前狀態
✅ 邦瓏建設使用 JSON Storage + S3 架構
✅ 已確認不使用 PostgreSQL/Prisma

## 可安全刪除的 Vercel 環境變數

### 1. PostgreSQL 相關 (完全不使用)
```bash
vercel env rm POSTGRES_HOST production
vercel env rm POSTGRES_URL_NO_SSL production
vercel env rm PGUSER production
vercel env rm PGHOST_UNPOOLED production
vercel env rm PGDATABASE production
vercel env rm PGPASSWORD production
vercel env rm POSTGRES_DATABASE production
vercel env rm POSTGRES_PASSWORD production
vercel env rm DATABASE_URL production
vercel env rm POSTGRES_USER production
vercel env rm PGHOST production
vercel env rm POSTGRES_URL_NON_POOLING production
vercel env rm DATABASE_URL_UNPOOLED production
vercel env rm POSTGRES_PRISMA_URL production
vercel env rm POSTGRES_URL production
```

### 2. API Gateway (未使用)
```bash
vercel env rm API_GATEWAY_URL production
vercel env rm API_GATEWAY_API_KEY production
```

### 3. 重複的 AWS 變數 (保留 S3_* 版本)
```bash
vercel env rm AWS_S3_BUCKET production
vercel env rm AWS_S3_REGION production
vercel env rm AWS_ACCESS_KEY_ID production
vercel env rm AWS_SECRET_ACCESS_KEY production
vercel env rm AWS_S3_PREFIX production
```

## 必須保留的環境變數

### Storage (JSON + S3)
- ✅ STORAGE_TYPE
- ✅ S3_BUCKET
- ✅ S3_REGION
- ✅ S3_ACCESS_KEY_ID
- ✅ S3_SECRET_ACCESS_KEY

### NextAuth
- ✅ NEXTAUTH_SECRET
- ✅ NEXTAUTH_URL

### Vercel Blob (文件上傳)
- ✅ BLOB_READ_WRITE_TOKEN

### Site Configuration
- ✅ NEXT_PUBLIC_SITE_NAME
- ✅ NEXT_PUBLIC_SITE_URL

### Monitoring (可選)
- ✅ SENTRY_AUTH_TOKEN
- ✅ NEXT_PUBLIC_SENTRY_DSN

## 本地環境變數清理

### .env.local 應該保留:
```env
STORAGE_TYPE=json

S3_BUCKET=company-assets-tw-2025
S3_REGION=ap-northeast-1
S3_ACCESS_KEY_ID=你的密鑰
S3_SECRET_ACCESS_KEY=你的密鑰

NEXTAUTH_SECRET=你的密鑰
NEXTAUTH_URL=http://localhost:3000

BLOB_READ_WRITE_TOKEN=你的token
```

### 可以移除的註解區塊:
```env
# ============================================
# PostgreSQL (for Prisma storage - backup)
# ============================================
# POSTGRES_PRISMA_URL=...
# POSTGRES_URL_NON_POOLING=...
```

## 清理後的好處
1. ✅ 減少混淆 - 只保留實際使用的變數
2. ✅ 提高安全性 - 減少不必要的敏感資料
3. ✅ 降低成本 - Vercel 按環境變數數量計費
4. ✅ 易於維護 - 清晰的配置結構
