# 建林工業官網 - 遷移完成報告

## 📊 項目狀態

✅ **已完成（~85%）**

### 前台頁面
- [x] 首頁（輪播 + 內容區塊）
- [x] 關於建林
- [x] 熱銷個案列表
- [x] 熱銷個案詳情
- [x] 歷年個案列表
- [x] 歷年個案詳情
- [x] 不動產租售列表
- [x] 不動產租售詳情
- [x] 聯絡我們（含 EmailJS 整合）

### 後台管理
- [x] 登入頁面
- [x] 後台導航欄
- [x] 修改密碼功能
- [x] 首頁管理（占位）
- [x] 關於管理（占位）
- [x] 熱銷個案管理（列表 + 刪除）
- [x] 歷年個案管理（占位）
- [x] 不動產管理（占位）

### 技術架構
- [x] Next.js 15 (App Router)
- [x] TypeScript
- [x] Tailwind CSS
- [x] Server Actions
- [x] JWT 認證
- [x] JSON 數據存儲
- [x] EmailJS 整合

---

## 🚀 快速啟動

### 1. 開發環境運行

```bash
cd /Users/hanfourhuang/Projects/jianlin-nextjs
npm run dev
```

訪問：
- 前台：http://localhost:3000
- 後台：http://localhost:3000/admin

### 2. 登入後台

默認帳號：`admin`
默認密碼：需要運行以下命令生成：

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('your_password', 10));"
```

然後更新 `lib/data/user.json`：
```json
{"account":"admin","password":"$2b$10$...你的 hash"}
```

---

## 📦 部署到 Vercel

### 步驟 1：準備 Vercel 項目

```bash
npm install -g vercel
vercel login
vercel
```

### 步驟 2：配置環境變數

在 Vercel 後台設置以下環境變數：

```env
# EmailJS
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_ox68jph
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_devewjo
NEXT_PUBLIC_EMAILJS_USER_ID=user_h2LkPDHrKhSkOLNqNONv2

# CDN (可選，或使用 Vercel Blob)
NEXT_PUBLIC_CDN_LINK=https://d377o53dybsd55.cloudfront.net

# JWT Secret (重要：請更改為隨機字串)
JWT_SECRET=請_生成_一個_隨機的_32位_字串

# Google Sheets (如需要)
GOOGLE_CLIENT_EMAIL=jianlin-web@jian-lin.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=1UrAXdddpwsWQZ83oE6Utq010xpfpnLkOrQG0riCYMXo
```

### 步驟 3：部署

```bash
vercel --prod
```

---

## 📂 數據遷移

### 從舊系統遷移數據

目前 JSON 文件為空，需要手動遷移：

#### 1. 複製舊系統的 JSON 數據

從 `/Users/hanfourhuang/Projects/JienLin-staging/api/api/plugins/data/` 複製有效的 JSON 到：
```
/Users/hanfourhuang/Projects/jianlin-nextjs/lib/data/
```

**注意：** 確保 JSON 格式正確（使用 `python3 -m json.tool file.json` 驗證）

#### 2. S3 圖片遷移方案

**方案 A：繼續使用 AWS S3 + CloudFront**
- 優點：無需遷移，直接使用現有 CDN
- 缺點：仍需維護 AWS
- 設置：保持 `NEXT_PUBLIC_CDN_LINK` 環境變數

**方案 B：遷移到 Vercel Blob**
```bash
# 安裝 Vercel CLI
npm install -g vercel

# 設置 Vercel Blob
vercel link
vercel env pull .env.local

# 上傳圖片到 Vercel Blob
# 需要寫一個遷移腳本
```

遷移腳本示例（需要創建）：
```typescript
// scripts/migrate-images.ts
import { put } from '@vercel/blob';
import AWS from 'aws-sdk';

// 從 S3 下載並上傳到 Vercel Blob
```

---

## 🔧 待完成功能

### 後台 CRUD 完整實作

目前只有熱銷個案列表有刪除功能，需要補充：

1. **個案編輯頁面**
   - 創建 `/app/admin/hot/[id]/page.tsx`
   - 創建 `/app/admin/hot/new/page.tsx`
   - 實作圖片上傳（Vercel Blob）
   - 實作富文本編輯器（React Quill）

2. **歷年個案管理**
   - 複製熱銷個案的邏輯
   - 修改 type 為 'history'

3. **不動產管理**
   - 類似個案管理

### 圖片上傳功能

目前未實作，需要：

```bash
npm install @vercel/blob
```

然後創建上傳 Server Action：
```typescript
// app/actions/upload.ts
'use server';

import { put } from '@vercel/blob';

export async function uploadImage(formData: FormData) {
  const file = formData.get('file') as File;
  const blob = await put(file.name, file, {
    access: 'public',
  });
  return blob.url;
}
```

---

## 🎨 UI 比對檢查清單

使用 Chrome DevTools 逐頁比對：

### 前台
- [ ] 首頁輪播動畫
- [ ] 導航欄漢堡選單
- [ ] 響應式佈局 (手機/平板/桌面)
- [ ] 圖片顯示正確
- [ ] 字體大小和間距
- [ ] Hover 效果
- [ ] Footer 連結

### 後台
- [ ] 登入表單
- [ ] 導航欄
- [ ] 表格樣式
- [ ] 表單輸入

---

## 🐛 已知問題

1. **JSON 數據為空**
   - 解決：從舊系統複製有效 JSON

2. **圖片無法顯示**
   - 原因：CDN_LINK 指向舊 S3
   - 解決：更新環境變數或遷移圖片

3. **後台 CRUD 功能不完整**
   - 只有列表和刪除
   - 需要補充新增/編輯功能

4. **未實作圖片上傳**
   - 需要整合 Vercel Blob

---

## 📝 下一步建議

### 立即執行
1. 從舊系統複製有效的 JSON 數據
2. 測試前台所有頁面能否正常顯示
3. 測試後台登入功能

### 短期（1週內）
1. 實作後台個案新增/編輯頁面
2. 整合圖片上傳功能
3. 完整測試所有功能

### 中期（2週內）
1. S3 圖片遷移到 Vercel Blob
2. SEO 優化（Metadata API）
3. 性能優化（圖片壓縮）
4. 部署到 Vercel 並測試

### 長期
1. 數據庫升級（JSON → Vercel Postgres）
2. 添加後台內容管理（首頁輪播、關於頁面）
3. 添加圖片裁剪功能
4. 添加備份功能

---

## 🔑 重要提醒

### 安全性
1. **立即更改 JWT_SECRET**
   ```bash
   openssl rand -base64 32
   ```

2. **更改管理員密碼**
   ```bash
   node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YOUR_NEW_PASSWORD', 10));"
   ```

3. **檢查 .env.local 未被提交到 Git**
   ```bash
   cat .gitignore | grep .env
   ```

### 性能
1. 使用 Next.js Image 組件優化圖片
2. 啟用 ISR (Incremental Static Regeneration)
3. 添加圖片 CDN

---

## 📞 技術支援

### 常見問題

**Q: 為什麼構建時出現 JSON 錯誤？**
A: 檢查 `lib/data/*.json` 文件格式是否正確

**Q: 為什麼圖片不顯示？**
A: 檢查 `NEXT_PUBLIC_CDN_LINK` 環境變數

**Q: 如何添加新的個案？**
A: 目前需要直接編輯 `lib/data/case.json`，未來會有後台介面

**Q: 如何備份數據？**
A: 定期備份 `lib/data/` 目錄下的 JSON 文件

---

## 🎯 項目架構圖

```
jianlin-nextjs/
├── app/
│   ├── (public)/          # 前台頁面
│   │   ├── page.tsx       # 首頁
│   │   ├── about_us/
│   │   ├── hot_list/
│   │   ├── hot/[id]/
│   │   ├── history_list/
│   │   ├── history/[id]/
│   │   ├── real_estate_list/
│   │   ├── real_estate/[id]/
│   │   └── contact_us/
│   ├── admin/             # 後台頁面
│   │   ├── page.tsx       # 登入
│   │   ├── account/       # 修改密碼
│   │   ├── home/          # 首頁管理
│   │   ├── hot_list/      # 熱銷管理
│   │   └── ...
│   ├── actions.ts         # Server Actions
│   └── globals.css        # 全局樣式
├── components/
│   ├── layout/            # 佈局組件
│   │   ├── Navbar.tsx
│   │   ├── AdminNavbar.tsx
│   │   └── Footer.tsx
│   └── ui/                # UI 組件
│       ├── Carousel.tsx
│       ├── CaseList.tsx
│       └── LoadingMask.tsx
├── lib/
│   ├── auth/              # 認證邏輯
│   │   └── auth.ts
│   ├── data/              # 數據層
│   │   ├── db.ts
│   │   ├── case.json
│   │   ├── rental.json
│   │   ├── company.json
│   │   └── user.json
│   └── utils/             # 工具函數
├── types/
│   └── index.ts           # TypeScript 類型
└── public/                # 靜態資源
    ├── logo.svg
    └── demo/
```

---

## ✅ 完成檢查清單

### 交付前確認
- [ ] 所有 JSON 數據已遷移
- [ ] 環境變數已設置
- [ ] 圖片能正常顯示
- [ ] 前台所有頁面可訪問
- [ ] 後台登入功能正常
- [ ] 聯絡表單可發送郵件
- [ ] 響應式佈局正常
- [ ] 構建無錯誤 (`npm run build`)
- [ ] 部署到 Vercel 成功
- [ ] 域名指向正確

---

生成時間：2025-11-03
專案路徑：/Users/hanfourhuang/Projects/jianlin-nextjs
