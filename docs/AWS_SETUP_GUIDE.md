# AWS S3 統一儲存設定指南

本指南將協助你在 AWS 建立統一的圖片儲存環境，供所有公司網站專案使用。

---

## 📋 前置作業檢查清單

- [ ] AWS 帳號（建議使用新的專門帳號）
- [ ] AWS Console 登入權限
- [ ] AWS CLI 已安裝（選用，但建議安裝）

---

## 🚀 Step 1: 建立 S3 Bucket

### 1.1 登入 AWS Console

前往：https://console.aws.amazon.com/s3/

### 1.2 建立新 Bucket

點擊 **「Create bucket」**，填入以下資訊：

**基本設定：**
- **Bucket name**: `company-assets-tw-2025`
- **AWS Region**: `ap-northeast-1`（東京，與現有的 jienlin bucket 相同）

**Object Ownership：**
- 選擇 **「ACLs disabled (recommended)」**

**Block Public Access settings：**
- ✅ **取消勾選** "Block all public access"
- ⚠️ 勾選確認框："I acknowledge that the current settings might result in this bucket and the objects within becoming public"

> 💡 **為什麼要允許公開訪問？**
> 因為你的網站需要直接從瀏覽器載入圖片。我們會在後面設定 Bucket Policy 來精確控制哪些檔案可以被公開訪問。

**Bucket Versioning：**（選用）
- 選擇 **「Enable」** 如果你想保留圖片的歷史版本（建議啟用，以防誤刪）

**Default encryption：**
- 選擇 **「Enable」**
- Encryption type: **「Server-side encryption with Amazon S3 managed keys (SSE-S3)」**

點擊 **「Create bucket」**

---

## 🔐 Step 2: 設定 Bucket CORS

### 2.1 進入 Bucket 設定

1. 點擊剛建立的 `company-assets-tw-2025` bucket
2. 點擊上方的 **「Permissions」** 標籤
3. 滾動到 **「Cross-origin resource sharing (CORS)」** 區塊
4. 點擊 **「Edit」**

### 2.2 貼上 CORS 設定

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD"
    ],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://www.jianlin.com.tw",
      "https://jianlin.com.tw"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-request-id"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

> 💡 **未來新增專案時**，記得在 `AllowedOrigins` 加入新網域！

點擊 **「Save changes」**

---

## 🌐 Step 3: 設定 Bucket Policy（公開讀取權限）

### 3.1 編輯 Bucket Policy

在同一個 **「Permissions」** 標籤中：
1. 滾動到 **「Bucket policy」** 區塊
2. 點擊 **「Edit」**

### 3.2 貼上 Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::company-assets-tw-2025/*"
    }
  ]
}
```

> 💡 **這個 Policy 做什麼？**
> 允許任何人**讀取**（下載）bucket 中的檔案，但**不能上傳、刪除或修改**。

點擊 **「Save changes」**

---

## 👤 Step 4: 建立 IAM User（程式用）

### 4.1 前往 IAM Console

前往：https://console.aws.amazon.com/iam/

### 4.2 建立新 User

1. 左側選單點擊 **「Users」**
2. 點擊 **「Create user」**

**User details：**
- **User name**: `company-websites-upload`

點擊 **「Next」**

### 4.3 設定權限

選擇 **「Attach policies directly」**

點擊 **「Create policy」**（會開啟新視窗）

**在新視窗中：**

1. 點擊 **「JSON」** 標籤
2. 貼上以下 Policy：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucket",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::company-assets-tw-2025"
    },
    {
      "Sid": "UploadAndManageObjects",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::company-assets-tw-2025/*"
    }
  ]
}
```

3. 點擊 **「Next」**
4. **Policy name**: `CompanyWebsitesUploadPolicy`
5. 點擊 **「Create policy」**

**回到原本的視窗：**

1. 點擊重新整理按鈕（🔄）
2. 搜尋 `CompanyWebsitesUploadPolicy`
3. 勾選它
4. 點擊 **「Next」**
5. 點擊 **「Create user」**

---

## 🔑 Step 5: 建立 Access Key

### 5.1 進入 User 設定

1. 點擊剛建立的 `company-websites-upload` user
2. 點擊 **「Security credentials」** 標籤
3. 滾動到 **「Access keys」** 區塊
4. 點擊 **「Create access key」**

### 5.2 選擇用途

選擇 **「Application running outside AWS」**

點擊 **「Next」**

### 5.3 設定 Tag（選用）

**Description tag value**: `company-websites-monorepo`

點擊 **「Create access key」**

### 5.4 ⚠️ 重要！儲存 Credentials

**你只有這一次機會看到 Secret Access Key！**

複製以下兩個值到安全的地方（建議用密碼管理器）：

- **Access key ID**: `AKIA...`（20 個字元）
- **Secret access key**: `wJalrXUtnFEMI/...`（40 個字元）

點擊 **「Done」**

---

## 📂 Step 6: 建立資料夾結構（選用）

雖然 S3 沒有真正的「資料夾」，但我們可以用路徑前綴來組織檔案。

### 6.1 建立基礎結構

1. 進入 `company-assets-tw-2025` bucket
2. 點擊 **「Create folder」**

建立以下資料夾：
- `jianlin/`
- `jianlin/images/`
- `shared/`
- `shared/logos/`

---

## 🧪 Step 7: 測試設定

### 7.1 測試上傳（AWS Console）

1. 進入 `jianlin/images/` 資料夾
2. 點擊 **「Upload」**
3. 上傳一張測試圖片（例如 `test.jpg`）
4. 點擊 **「Upload」**

### 7.2 測試公開訪問

上傳完成後，點擊該圖片，複製 **「Object URL」**，例如：
```
https://company-assets-tw-2025.s3.ap-northeast-1.amazonaws.com/jianlin/images/test.jpg
```

在瀏覽器中開啟這個 URL，如果能看到圖片，設定就成功了！✅

### 7.3 測試 CORS（選用）

在瀏覽器的開發者工具 Console 執行：

```javascript
fetch('https://company-assets-tw-2025.s3.ap-northeast-1.amazonaws.com/jianlin/images/Gemini_Generated_Image_d2d7j9d2d7j9d2d7.png')
  .then(r => console.log('✅ CORS 設定正確！', r))
  .catch(e => console.error('❌ CORS 有問題', e));
```

---

## 📋 環境變數設定

將以下資訊加入你的 `.env.local`：

```bash
# AWS S3 設定
AWS_S3_BUCKET=company-assets-tw-2025
AWS_S3_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=AKIA...（你的 Access Key ID）
AWS_SECRET_ACCESS_KEY=wJalrXUtn...（你的 Secret Access Key）

# 專案特定設定
AWS_S3_PREFIX=jianlin/
```

⚠️ **重要安全提示：**
- **不要**將 `.env.local` 提交到 Git
- **不要**將 credentials 分享給任何人
- 定期輪換 Access Keys（建議 90 天一次）

---

## ✅ 完成檢查清單

確認以下項目都已完成：

- [V] S3 Bucket `company-assets-tw-2025` 已建立
- [V] CORS 已設定
- [V] Bucket Policy 已設定（公開讀取）
- [V] IAM User `company-websites-upload` 已建立
- [V] IAM Policy `CompanyWebsitesUploadPolicy` 已附加
- [V] Access Key 已建立並安全儲存
- [V] 測試圖片可以公開訪問
- [ ] `.env.local` 已設定

---

## 🔄 下一步

AWS 環境設定完成後，回到開發工作：

1. **遷移現有圖片**（見 `MIGRATION_GUIDE.md`）
2. **實作 upload-service package**
3. **更新管理後台加入檔案上傳功能**

---

## 🆘 常見問題

### Q1: 無法上傳檔案，顯示 "Access Denied"

**A:** 檢查 IAM User 的 Policy 是否正確附加，特別是 `s3:PutObject` 權限。

### Q2: 圖片上傳成功但無法在瀏覽器中開啟

**A:** 檢查 Bucket Policy 是否有 `s3:GetObject` 權限給 `Principal: "*"`。

### Q3: CORS 錯誤

**A:**
1. 確認你的網域已加入 `AllowedOrigins`
2. 確認瀏覽器沒有快取舊的 CORS 設定（清除快取或無痕模式測試）

### Q4: Access Key 洩漏了怎麼辦？

**A:**
1. 立即前往 IAM Console
2. 刪除該 Access Key
3. 建立新的 Access Key
4. 更新 `.env.local`
5. 考慮使用 AWS Secrets Manager 或環境變數管理工具

---

## 📚 參考資源

- [AWS S3 官方文檔](https://docs.aws.amazon.com/s3/)
- [S3 CORS 設定](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
