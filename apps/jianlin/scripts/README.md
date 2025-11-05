# 圖片遷移工具說明

## 概述

這組工具用於將建林網站的圖片從舊 S3 bucket (`jienlin`) 遷移到新 bucket (`company-assets-tw-2025`)。

## 遷移狀態

### ✅ 已完成

1. **URL 更新** - 所有 JSON 檔案中的圖片 URL 已更新
   - `lib/data/case.json` - 26 個圖片
   - `lib/data/company.json` - 24 個圖片
   - 總計 50 個唯一圖片 URL

2. **遷移腳本** - 已建立並測試
   - `migrate-images.js` - 從舊 bucket 複製圖片到新 bucket
   - `update-image-urls.js` - 更新 JSON 檔案中的 URL（已執行）
   - `verify-images.js` - 驗證圖片 URL 和遷移狀態

### ⏳ 待完成

**實際圖片複製** - 需要 AWS 憑證才能執行

## 使用指南

### 1. 驗證當前狀態

\`\`\`bash
node scripts/verify-images.js
\`\`\`

這會顯示：
- 總圖片數量
- 新舊 bucket URL 分布
- 前 5 個 URL 的可訪問性測試

### 2. 執行圖片遷移（需要 AWS 憑證）

#### 步驟 1: 設定環境變數

\`\`\`bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_S3_BUCKET=company-assets-tw-2025
\`\`\`

#### 步驟 2: 執行遷移

\`\`\`bash
node scripts/migrate-images.js
\`\`\`

#### 步驟 3: 驗證遷移結果

\`\`\`bash
node scripts/verify-images.js
\`\`\`

## 工具詳細說明

### migrate-images.js

**功能：** 從舊 bucket 複製圖片到新 bucket

**來源：**
- Bucket: \`jienlin\`
- Region: \`ap-northeast-1\`

**目標：**
- Bucket: \`company-assets-tw-2025\`
- Prefix: \`jianlin/\`

### update-image-urls.js

**功能：** 更新 JSON 檔案中的圖片 URL（已執行完成）

### verify-images.js

**功能：** 驗證圖片 URL 狀態

**狀態碼說明：**
- \`200/304\` - 圖片可正常訪問 ✅
- \`403\` - 圖片存在但無權限訪問（可能尚未遷移）❌
- \`404\` - 圖片不存在 ❌

## 總結

**當前狀態：**
- ✅ JSON 檔案已更新
- ⏳ 等待 AWS 憑證後執行實際遷移

**下一步：**
1. 取得 AWS 憑證
2. 執行 \`node scripts/migrate-images.js\`
3. 驗證結果
