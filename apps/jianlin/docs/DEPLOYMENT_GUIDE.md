# 部署指南

## 環境需求

### 必要條件
- Node.js 20.x 或以上
- npm 9.x 或以上
- AWS S3 Bucket（圖片存儲）
- 域名和 SSL 證書

### 環境變數
創建 `.env.local` 文件（生產環境）：

```bash
# JWT Secret（必須是強隨機密鑰，至少 32 字元）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# AWS S3 設定
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_S3_BUCKET=your-bucket-name
AWS_S3_REGION=ap-northeast-1
AWS_S3_PREFIX=jianlin/

# Sentry（錯誤追蹤，可選）
SENTRY_AUTH_TOKEN=your-sentry-token
```

---

## 本地開發

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動開發服務器
```bash
npm run dev
```

訪問: `http://localhost:3000`

### 3. 運行測試
```bash
# 單元測試
npm test

# E2E 測試（互動模式）
npm run cypress

# E2E 測試（無頭模式）
npm run cypress:headless
```

---

## 生產構建

### 1. 構建應用
```bash
npm run build
```

### 2. 驗證構建
```bash
npm start
```

訪問: `http://localhost:3000`

### 3. 檢查構建輸出
構建產物位於 `.next/` 目錄

---

## Vercel 部署（推薦）

### 方法 1: GitHub 整合

#### 步驟 1: 推送到 GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 步驟 2: Vercel 設定
1. 登入 [Vercel](https://vercel.com)
2. 點擊 "Import Project"
3. 選擇 GitHub Repository
4. 配置環境變數（從 .env.local 複製）

#### 步驟 3: 部署
Vercel 會自動：
- ✅ 構建應用
- ✅ 部署到 CDN
- ✅ 生成預覽 URL

### 方法 2: CLI 部署

#### 安裝 Vercel CLI
```bash
npm i -g vercel
```

#### 登入
```bash
vercel login
```

#### 部署
```bash
# 生產部署
vercel --prod

# 預覽部署
vercel
```

---

## 自主伺服器部署

### 使用 Docker

#### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# 安裝依賴
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# 構建應用
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 運行應用
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

#### 構建 Docker 映像
```bash
docker build -t jianlin-website .
```

#### 運行容器
```bash
docker run -p 3000:3000 \
  -e JWT_SECRET=your-secret \
  -e AWS_ACCESS_KEY_ID=your-key \
  -e AWS_SECRET_ACCESS_KEY=your-secret \
  -e AWS_S3_BUCKET=your-bucket \
  jianlin-website
```

---

## 環境配置

### 生產環境檢查清單

#### 安全性 ✅
- [ ] `JWT_SECRET` 使用強隨機密鑰（>= 32 字元）
- [ ] 所有環境變數正確設定
- [ ] 啟用 HTTPS
- [ ] 設定 CORS 白名單
- [ ] 啟用 CSP（Content Security Policy）

#### 性能 ✅
- [ ] 啟用 Gzip 壓縮
- [ ] 配置 CDN（圖片、靜態資源）
- [ ] 設定快取標頭
- [ ] 優化圖片格式（AVIF/WebP）

#### SEO ✅
- [ ] robots.txt 正確
- [ ] sitemap.xml 生成
- [ ] Meta tags 完整
- [ ] Open Graph 設定

#### 監控 ✅
- [ ] Sentry 錯誤追蹤
- [ ] 日誌記錄
- [ ] 性能監控

---

## 域名設定

### DNS 配置
```
A     @       76.76.21.21     # Vercel IP
CNAME www     cname.vercel-dns.com
```

### SSL 證書
Vercel 自動提供 Let's Encrypt SSL 證書

---

## CI/CD 設定

### GitHub Actions

創建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 備份策略

### JSON 數據備份
```bash
# 每日備份腳本
#!/bin/bash
DATE=$(date +%Y-%m-%d)
cp data/company.json backups/company-$DATE.json
```

### S3 備份
AWS S3 已提供 99.999999999% 數據持久性

---

## 監控與維護

### 健康檢查端點
創建 `app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date() });
}
```

### 監控服務
- **Uptime**: Pingdom, UptimeRobot
- **Performance**: Vercel Analytics
- **Errors**: Sentry

---

## 故障排除

### 常見問題

#### 1. 構建失敗
```bash
# 清除快取
rm -rf .next node_modules
npm install
npm run build
```

#### 2. 環境變數未生效
- 確認 `.env.local` 存在
- 重啟開發服務器
- Vercel: 在 Dashboard 設定環境變數

#### 3. 圖片無法上傳
- 檢查 AWS 憑證
- 確認 S3 Bucket 權限
- 驗證 CORS 設定

---

## 回滾策略

### Vercel 回滾
1. 進入 Vercel Dashboard
2. 選擇 "Deployments"
3. 找到穩定版本
4. 點擊 "Promote to Production"

### Git 回滾
```bash
git revert HEAD
git push origin main
```

---

## 性能優化建議

### 1. 圖片優化
- 使用 Next.js Image 組件
- 啟用 AVIF/WebP
- 設定適當尺寸

### 2. 代碼分割
- 動態 import 大型組件
- 路由自動分割

### 3. 快取策略
- 靜態資源: 1 年
- API: 根據更新頻率
- 圖片: CDN + 瀏覽器快取

---

## 聯繫支援

部署問題請聯繫:
- **技術支援**: tech@jianlin.com.tw
- **緊急聯繫**: +886-X-XXXX-XXXX
