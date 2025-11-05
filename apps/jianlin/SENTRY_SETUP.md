# Sentry 設定指南

## 1. 獲取 Sentry DSN

1. 訪問 [Sentry 專案設定](https://sentry.io/settings/hanfourhuang/projects/javascript-nextjs/keys/)
2. 複製 **DSN** (Data Source Name)
3. 將 DSN 添加到 `.env.local` 文件中的 `NEXT_PUBLIC_SENTRY_DSN` 變數

範例：
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn-key@o4505000000000000.ingest.sentry.io/4505000000000000
```

## 2. 獲取 Sentry Auth Token (用於上傳 Source Maps)

1. 訪問 [Sentry Auth Tokens 設定](https://sentry.io/settings/account/api/auth-tokens/)
2. 點擊 **Create New Token**
3. 設定以下權限：
   - `project:releases`
   - `project:write`
4. 複製生成的 Token
5. 將 Token 添加到 `.env.local` 文件中的 `SENTRY_AUTH_TOKEN` 變數

範例：
```env
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here
```

## 3. 測試 Sentry 設定

### 方法 1：使用測試頁面

1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 訪問測試頁面：
   ```
   http://localhost:3000/sentry-example-page
   ```

3. 點擊 **"Throw error!"** 按鈕

4. 前往 [Sentry Issues 頁面](https://hanfourhuang.sentry.io/issues/) 查看錯誤報告

### 方法 2：手動觸發錯誤

在任何組件中調用不存在的函數：

```javascript
// 這會觸發一個錯誤並發送到 Sentry
myUndefinedFunction();
```

## 4. Sentry 功能說明

### 已啟用的功能

#### Client-Side (瀏覽器)
- ✅ 錯誤追蹤與報告
- ✅ Session Replay (10% 採樣率，錯誤時 100%)
- ✅ Performance Monitoring (追蹤採樣率 100%)
- ✅ React Component Annotation (顯示完整元件名稱)

#### Server-Side (伺服器)
- ✅ API 錯誤追蹤
- ✅ Server-side Performance Monitoring
- ✅ Automatic Vercel Cron Monitors

#### Edge Runtime
- ✅ Middleware 錯誤追蹤
- ✅ Edge Function 錯誤追蹤

### 進階配置

#### Source Maps 上傳
- ✅ 自動上傳 Source Maps 到 Sentry
- ✅ 在生產環境中隱藏 Source Maps
- ✅ 更好的錯誤堆疊追蹤

#### Ad-Blocker 規避
- ✅ 透過 `/monitoring` 路由代理 Sentry 請求
- ⚠️ 注意：這會增加伺服器負載

#### 效能優化
- ✅ 自動 Tree-shake Sentry logger
- ✅ 減少 bundle 大小

## 5. 環境變數總覽

```env
# Sentry DSN (公開，可在前端使用)
NEXT_PUBLIC_SENTRY_DSN=https://...

# Sentry Auth Token (私密，僅在建置時使用)
SENTRY_AUTH_TOKEN=...
```

## 6. 採樣率說明

### Traces (效能追蹤)
- 開發環境：100% (追蹤所有請求)
- 生產環境：建議調整為 10-20%

### Session Replay
- 正常 Session：10% (節省配額)
- 錯誤 Session：100% (重現問題)

### 調整採樣率

編輯 `sentry.client.config.ts`：

```typescript
Sentry.init({
  // ...
  tracesSampleRate: 0.1,  // 10% 追蹤
  replaysSessionSampleRate: 0.1,  // 10% Session
  replaysOnErrorSampleRate: 1.0,  // 100% 錯誤
});
```

## 7. 生產環境檢查清單

- [ ] 已設定 `NEXT_PUBLIC_SENTRY_DSN`
- [ ] 已設定 `SENTRY_AUTH_TOKEN`
- [ ] 已測試錯誤報告功能
- [ ] 已調整採樣率 (避免超出配額)
- [ ] 已在 Vercel 環境變數中設定相同的值
- [ ] 已刪除或隱藏 `/sentry-example-page` (可選)

## 8. 常見問題

### Q: 為什麼看不到錯誤報告？
- 檢查 DSN 是否正確設定
- 檢查瀏覽器 Console 是否有 Sentry 相關錯誤
- 確認網路請求未被 Ad-Blocker 阻擋

### Q: Source Maps 沒有上傳？
- 檢查 `SENTRY_AUTH_TOKEN` 是否正確
- 確認 Token 有正確的權限 (`project:releases`, `project:write`)
- 檢查建置日誌是否有錯誤訊息

### Q: 如何在生產環境禁用 debug？
已自動配置，`debug: false` 在所有環境中。

## 9. 相關連結

- [Sentry Dashboard](https://hanfourhuang.sentry.io/)
- [Issues 頁面](https://hanfourhuang.sentry.io/issues/)
- [專案設定](https://sentry.io/settings/hanfourhuang/projects/javascript-nextjs/)
- [Sentry Next.js 文檔](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

## 快速開始

```bash
# 1. 設定環境變數
# 在 .env.local 中添加 NEXT_PUBLIC_SENTRY_DSN 和 SENTRY_AUTH_TOKEN

# 2. 重新啟動開發伺服器
npm run dev

# 3. 訪問測試頁面
open http://localhost:3000/sentry-example-page

# 4. 點擊按鈕觸發測試錯誤

# 5. 前往 Sentry Dashboard 查看錯誤
open https://hanfourhuang.sentry.io/issues/
```
