# 部署指南

本文檔說明如何部署 Monorepo 中的專案，以及如何提取單一專案交付給廠商。

## 📋 目錄

1. [Monorepo 架構](#monorepo-架構)
2. [Vercel 部署策略](#vercel-部署策略)
3. [提取單一專案](#提取單一專案)
4. [常見問題](#常見問題)

---

## 🏗️ Monorepo 架構

### 目錄結構

```
company-websites/
├── apps/
│   ├── jianlin/              # 建林工業 Next.js 專案
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── package.json
│   │   └── .env.local
│   └── banlong/              # 邦瓏建設（未來）
├── packages/
│   ├── api-template/         # 共用 API 模板
│   │   ├── routes/          # 統一的 API Routes
│   │   └── package.json
│   └── ui/                   # 共用 UI 元件（未來）
├── turbo.json               # Turborepo 配置
├── package.json             # Root package.json
└── scripts/
    └── extract-project.sh   # 提取專案腳本
```

### 為什麼使用 Monorepo？

✅ **優點：**
- 共用程式碼（API templates, UI components）
- 統一的開發工具和配置
- 原子性提交（一次 commit 可以更新多個專案）
- 更容易重構和維護

⚠️ **注意事項：**
- 需要正確配置部署流程
- 要小心處理各專案的環境變數
- 提取專案給廠商需要額外步驟

---

## 🚀 Vercel 部署策略

### Option 1: 分別部署（推薦）✅

每個 app 建立獨立的 Vercel 專案：

#### 1. 建立建林工業專案

在 Vercel Dashboard：
1. New Project → Import Git Repository
2. 選擇 `company-websites` repository
3. 設定：
   - **Project Name**: `jianlin`
   - **Root Directory**: `apps/jianlin`
   - **Framework Preset**: Next.js
   - **Build Command**: `cd ../.. && npx turbo run build --filter=jianlin`
   - **Output Directory**: `apps/jianlin/.next`
   - **Install Command**: `npm install`

4. 環境變數：
   ```
   API_GATEWAY_URL=https://api.miilink.net/send
   API_GATEWAY_API_KEY=5drBm3kJgf6LvPsAbFtE96Wf8BeXsZzk3H4lZhBP
   CONTACT_EMAIL_RECEIVERS=info@jianlin.com.tw
   ```

#### 2. 設定自訂網域

在 Vercel Project Settings → Domains：
- `jianlin.com.tw`
- `www.jianlin.com.tw`

#### 3. CLI 部署

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署建林工業
cd apps/jianlin
vercel

# 部署到生產環境
vercel --prod
```

### Option 2: 使用 Turborepo Remote Cache（進階）

設定 Vercel 作為 Remote Cache：

```bash
# 登入 Vercel
npx turbo login

# 連結專案
npx turbo link

# 之後的 build 會自動使用 cache
npx turbo run build --filter=jianlin
```

---

## 📦 提取單一專案

當需要將專案交付給廠商或建立獨立 repository 時：

### 方法 1: 使用自動化腳本（推薦）✅

```bash
# 提取建林工業專案
cd /path/to/company-websites
./scripts/extract-project.sh jianlin ~/Desktop/jianlin-standalone

# 進入提取的專案
cd ~/Desktop/jianlin-standalone

# 安裝依賴
npm install

# 測試運行
npm run dev
```

### 方法 2: 手動提取

```bash
# 1. 建立新目錄
mkdir jianlin-standalone
cd jianlin-standalone

# 2. 複製專案檔案
cp -r /path/to/company-websites/apps/jianlin/* .
cp -r /path/to/company-websites/apps/jianlin/.* . 2>/dev/null || true

# 3. 複製共用套件
mkdir -p packages
cp -r /path/to/company-websites/packages/api-template packages/

# 4. 更新 package.json
# 將 "@repo/api-template": "workspace:*" 改為 "file:./packages/api-template"

# 5. 初始化 Git
git init
git add .
git commit -m "Initial commit"
```

### 提取後的專案結構

```
jianlin-standalone/
├── app/
├── components/
├── lib/
├── packages/
│   └── api-template/      # 內嵌的共用套件
├── package.json           # 獨立的 package.json
├── next.config.ts
├── .env.local.example
└── README.md
```

### 交付給廠商的步驟

1. **提取專案**
   ```bash
   ./scripts/extract-project.sh jianlin /path/to/delivery
   ```

2. **清理敏感資訊**
   ```bash
   cd /path/to/delivery
   rm -f .env.local           # 刪除本地環境變數
   rm -rf .git                # 刪除 Git 歷史（可選）
   ```

3. **建立交付文件**
   ```bash
   # 建立 HANDOVER.md
   cat > HANDOVER.md << 'EOF'
   # 建林工業網站 - 交付文件

   ## 環境需求
   - Node.js 18+
   - npm 9+

   ## 安裝步驟
   1. npm install
   2. 複製 .env.local.example 為 .env.local
   3. 填入環境變數
   4. npm run dev

   ## 環境變數說明
   - API_GATEWAY_URL: AWS API Gateway URL
   - API_GATEWAY_API_KEY: API 金鑰
   - CONTACT_EMAIL_RECEIVERS: 聯絡表單收件人

   ## 部署
   - Vercel: vercel --prod
   - Docker: docker build -t jianlin .
   EOF
   ```

4. **壓縮打包**
   ```bash
   cd ..
   tar -czf jianlin-delivery-$(date +%Y%m%d).tar.gz delivery/
   ```

---

## 🔧 常見問題

### Q1: 為什麼要用 Monorepo？

**A:**
- ✅ **重用程式碼**：多個公司網站共用 API templates、UI components
- ✅ **統一管理**：相同的開發工具、ESLint、TypeScript 配置
- ✅ **原子性更新**：一次 commit 可以同時更新 API template 和所有使用它的專案
- ✅ **更容易重構**：修改共用程式碼時可以立即看到影響

### Q2: 每個專案獨立部署還是一起部署？

**A:** **強烈建議獨立部署**
- ✅ 各專案有獨立的網域
- ✅ 各專案有獨立的環境變數
- ✅ 部署一個不影響其他
- ✅ 可以給不同客戶不同的訪問權限

### Q3: 共用的 packages 如何處理？

**A:**
- **開發階段**：使用 workspace 協議 (`workspace:*`)
- **提取階段**：自動轉換為本地路徑 (`file:./packages/api-template`)
- **部署階段**：Turborepo 會自動處理依賴關係

### Q4: 如何更新已交付的專案？

**A:** 有兩種策略：

**策略 1: 重新提取並比對**
```bash
# 提取新版本
./scripts/extract-project.sh jianlin /tmp/jianlin-new

# 使用 diff 工具比對差異
diff -r /path/to/old-delivery /tmp/jianlin-new

# 或使用 git
cd /path/to/old-delivery
git diff --no-index . /tmp/jianlin-new
```

**策略 2: 維護獨立的 Git Repository**
```bash
# 在第一次交付時建立 Git repo
cd /path/to/delivery
git init
git remote add origin git@github.com:company/jianlin.git
git push -u origin main

# 之後從 monorepo 同步更新
cd /path/to/company-websites
git subtree push --prefix=apps/jianlin git@github.com:company/jianlin.git main
```

### Q5: 部署時會打包整個 Monorepo 嗎？

**A:** **不會！** Vercel 只會打包指定的專案：
1. Vercel 讀取 `Root Directory` 設定（例如 `apps/jianlin`）
2. 執行 Build Command（`turbo run build --filter=jianlin`）
3. Turborepo 只會建置 jianlin 和它的依賴（`api-template`）
4. 其他專案不會被包含在部署中

### Q6: 環境變數如何管理？

**A:**
```bash
# 開發環境
apps/jianlin/.env.local          # 本地開發（不提交到 Git）
apps/jianlin/.env.local.example  # 範例檔案（提交到 Git）

# 生產環境
Vercel Dashboard → Project Settings → Environment Variables
```

### Q7: 如何處理不同專案的不同版本依賴？

**A:** 每個 app 有獨立的 `package.json`：
```json
// apps/jianlin/package.json
{
  "dependencies": {
    "next": "16.0.1",           // 建林使用 Next.js 16
    "@repo/api-template": "workspace:*"
  }
}

// apps/banlong/package.json
{
  "dependencies": {
    "next": "14.0.0",           // 邦瓏可以使用 Next.js 14
    "@repo/api-template": "workspace:*"
  }
}
```

---

## 📚 相關資源

- [Turborepo 官方文檔](https://turbo.build/repo/docs)
- [Vercel Monorepo 部署](https://vercel.com/docs/concepts/monorepos)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)

---

## 🆘 需要幫助？

如有問題，請聯絡開發團隊或查看：
- [Turborepo 文檔](https://turbo.build/repo/docs)
- [Vercel 支援](https://vercel.com/support)
