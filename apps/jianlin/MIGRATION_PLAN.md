# 建林工業官網遷移計畫

## ✅ 已完成

### 1. 專案初始化
- [x] 創建 Next.js 15 專案 (App Router + TypeScript + Tailwind)
- [x] 複製靜態資源 (logo, demo images)
- [x] 設置環境變數 (`.env.local`)
- [x] 創建專案目錄結構

### 2. 數據層
- [x] 定義 TypeScript 類型 (`types/index.ts`)
- [x] 複製 JSON 數據文件
- [x] 實作數據訪問層 (`lib/data/db.ts`)

### 3. 認證層
- [x] JWT 認證邏輯 (`lib/auth/auth.ts`)
- [x] Server Actions (`app/actions.ts`)
- [x] 登入/登出/修改密碼功能

## 🚧 進行中

### 4. UI 組件開發

#### 設計系統
- 主色: `#00638F` (藍色)
- 背景: `#FCFCFC` (淺灰)
- 字體: Noto Sans TC

#### 需要實作的組件
1. **Layout Components**
   - [ ] Navbar (前台漢堡選單導航)
   - [ ] AdminNavbar (後台導航欄)
   - [ ] Footer
   - [ ] LoadingMask (全屏載入)

2. **前台頁面**
   - [ ] `/` - 首頁 (輪播 + 3個內容區塊)
   - [ ] `/about_us` - 關於建林
   - [ ] `/hot_list` - 熱銷個案列表
   - [ ] `/hot/[id]` - 熱銷個案詳情
   - [ ] `/history_list` - 歷年個案列表
   - [ ] `/history/[id]` - 歷年個案詳情
   - [ ] `/real_estate_list` - 不動產租售列表
   - [ ] `/real_estate/[id]` - 不動產租售詳情
   - [ ] `/contact_us` - 聯絡我們

3. **後台頁面**
   - [ ] `/admin` - 登入頁
   - [ ] `/admin/account` - 修改密碼
   - [ ] `/admin/home` - 首頁管理
   - [ ] `/admin/about` - 關於建林管理
   - [ ] `/admin/hot_list` - 熱銷個案管理
   - [ ] `/admin/hot/[id]` - 編輯熱銷個案
   - [ ] `/admin/history_list` - 歷年個案管理
   - [ ] `/admin/history/[id]` - 編輯歷年個案
   - [ ] `/admin/real_estate_list` - 不動產租售管理
   - [ ] `/admin/real_estate/[id]` - 編輯不動產租售

### 5. 功能開發
- [ ] 圖片輪播 (Carousel)
- [ ] 圖片上傳 (Vercel Blob)
- [ ] 富文本編輯器 (React Quill 替代)
- [ ] Email 發送 (EmailJS)
- [ ] Google Sheets 整合 (後端)

## ⏳ 待完成

### 6. 測試與驗證
- [ ] 使用 Chrome DevTools MCP 比對每個頁面
- [ ] 測試所有表單功能
- [ ] 測試圖片上傳
- [ ] 測試後台 CRUD 功能
- [ ] 測試 RWD (響應式設計)

### 7. 部署
- [ ] 設置 Vercel 項目
- [ ] 配置環境變數
- [ ] 設置 Vercel Blob
- [ ] 遷移 S3 圖片到 Vercel Blob
- [ ] 設置域名 (jianlin.com.tw)
- [ ] SSL 配置

### 8. 清理
- [ ] 關閉 AWS 資源
- [ ] 更新 DNS 記錄
- [ ] 備份舊系統數據

## 路由對應表

| 舊路由 | 新路由 | 狀態 |
|-------|--------|------|
| `/` | `/` | ⏳ |
| `/about_us` | `/about_us` | ⏳ |
| `/hot_list` | `/hot_list` | ⏳ |
| `/hot/:id` | `/hot/[id]` | ⏳ |
| `/history_list` | `/history_list` | ⏳ |
| `/history/:id` | `/history/[id]` | ⏳ |
| `/real_estate_list` | `/real_estate_list` | ⏳ |
| `/real_estate/:id` | `/real_estate/[id]` | ⏳ |
| `/contact_us` | `/contact_us` | ⏳ |
| `/admin` | `/admin` | ⏳ |
| `/admin/account` | `/admin/account` | ⏳ |
| `/admin/home` | `/admin/home` | ⏳ |
| `/admin/about` | `/admin/about` | ⏳ |
| `/admin/hot_list` | `/admin/hot_list` | ⏳ |
| `/admin/hot/:id` | `/admin/hot/[id]` | ⏳ |
| `/admin/history_list` | `/admin/history_list` | ⏳ |
| `/admin/history/:id` | `/admin/history/[id]` | ⏳ |
| `/admin/real_estate_list` | `/admin/real_estate_list` | ⏳ |
| `/admin/real_estate/:id` | `/admin/real_estate/[id]` | ⏳ |

## 技術債務修復

### 安全問題
- ✅ Google Service Account Private Key 移到後端
- ✅ AWS Access Key 不再暴露給前端
- [ ] 添加 CSRF 保護
- [ ] 添加 Rate Limiting

### 性能優化
- [ ] 圖片優化 (Next.js Image)
- [ ] 代碼分割 (自動)
- [ ] SEO 優化 (Metadata API)
- [ ] ISR/SSG for 靜態頁面

## 下一步

1. 創建 Tailwind 配置 (加入自定義顏色)
2. 實作基礎 Layout 組件
3. 實作前台導航欄
4. 實作首頁
5. 逐頁實作其他頁面
6. 實作後台
7. 測試與驗證
