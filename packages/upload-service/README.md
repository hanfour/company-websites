# @repo/upload-service

統一的 S3 檔案上傳服務，供所有公司網站專案使用。支援圖片和大型文件上傳。

## 功能

### 圖片上傳（< 10MB）
- ✅ 產生預簽名上傳 URL（前端直接上傳到 S3）
- ✅ 自動產生唯一檔名（避免衝突）
- ✅ 驗證檔案類型和大小
- ✅ 支援格式：JPEG、PNG、GIF、WebP、SVG
- ✅ 最大檔案：10MB
- ✅ URL 有效期：5 分鐘

### 文件上傳（< 250MB）
- ✅ Multipart Upload（分片上傳）
- ✅ 支援斷點續傳
- ✅ 即時上傳進度
- ✅ 支援格式：PDF、DOC、DOCX、XLS、XLSX、PPT、PPTX、TXT、ZIP
- ✅ 最大檔案：250MB
- ✅ 每片大小：10MB
- ✅ URL 有效期：60 分鐘

### 多專案支援
- ✅ 透過路徑前綴區分專案（例如：`jianlin/`, `banlong/`）
- ✅ 圖片儲存在 `{prefix}/images/`
- ✅ 文件儲存在 `{prefix}/documents/`

## 安裝

在專案的 `package.json` 中加入：

\`\`\`json
{
  "dependencies": {
    "@repo/upload-service": "*"
  }
}
\`\`\`

## 設定環境變數

\`\`\`bash
# AWS S3 設定
AWS_S3_BUCKET=company-assets-tw-2025
AWS_S3_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# 專案特定設定（路徑前綴）
AWS_S3_PREFIX=jianlin/  # 或 banlong/ 等
\`\`\`

## 使用方式

### 1. 圖片上傳（簡單上傳）

適用於 < 10MB 的圖片檔案。

#### 後端 API

\`\`\`typescript
// app/api/admin/upload/presign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  generatePresignedUploadUrl,
  isValidImageType,
  isValidFileSize
} from '@repo/upload-service/presign';

export async function POST(request: NextRequest) {
  const { filename, contentType, fileSize } = await request.json();

  // 驗證
  if (!isValidImageType(contentType)) {
    return NextResponse.json({ error: '不支援的檔案格式' }, { status: 400 });
  }

  if (!isValidFileSize(fileSize, 10)) {
    return NextResponse.json({ error: '檔案大小超過 10MB' }, { status: 400 });
  }

  // 產生預簽名 URL
  const result = await generatePresignedUploadUrl(
    filename,
    contentType,
    'images/',  // 子資料夾
    300,        // 5 分鐘
    'image'     // 檔案類別
  );

  return NextResponse.json(result);
}
\`\`\`

#### 前端上傳

\`\`\`typescript
async function uploadImage(file: File) {
  // 1. 取得預簽名 URL
  const response = await fetch('/api/admin/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const { uploadUrl, publicUrl, key } = await response.json();

  // 2. 直接上傳到 S3
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  // 3. 使用 publicUrl 和 key
  console.log('上傳成功！', { publicUrl, key });
  return { publicUrl, key };
}
\`\`\`

### 2. 文件上傳（Multipart Upload）

適用於 10MB - 250MB 的大型文件。

#### 後端 API（3 個端點）

**初始化上傳**

\`\`\`typescript
// app/api/admin/upload/multipart/init/route.ts
import { initMultipartUpload } from '@repo/upload-service/multipart';
import { isValidDocumentType, isValidFileSize } from '@repo/upload-service/presign';

export async function POST(request: NextRequest) {
  const { filename, contentType, fileSize } = await request.json();

  if (!isValidDocumentType(contentType)) {
    return NextResponse.json({ error: '不支援的檔案格式' }, { status: 400 });
  }

  if (!isValidFileSize(fileSize, 250)) {
    return NextResponse.json({ error: '檔案大小超過 250MB' }, { status: 400 });
  }

  const result = await initMultipartUpload(
    filename,
    contentType,
    fileSize,
    'documents/'
  );

  return NextResponse.json(result);
}
\`\`\`

**取得分片 URL**

\`\`\`typescript
// app/api/admin/upload/multipart/parts/route.ts
import { getAllPartUploadUrls } from '@repo/upload-service/multipart';

export async function POST(request: NextRequest) {
  const { key, uploadId, totalParts } = await request.json();
  const urls = await getAllPartUploadUrls(key, uploadId, totalParts);
  return NextResponse.json({ parts: urls });
}
\`\`\`

**完成上傳**

\`\`\`typescript
// app/api/admin/upload/multipart/complete/route.ts
import { completeMultipartUpload } from '@repo/upload-service/multipart';

export async function POST(request: NextRequest) {
  const { key, uploadId, parts } = await request.json();
  await completeMultipartUpload(key, uploadId, parts);
  return NextResponse.json({ success: true });
}
\`\`\`

#### 前端上傳（分片）

\`\`\`typescript
async function uploadDocument(file: File) {
  // 1. 初始化
  const initRes = await fetch('/api/admin/upload/multipart/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size,
    }),
  });

  const { uploadId, key, chunkSize, totalParts, publicUrl } = await initRes.json();

  // 2. 取得所有分片 URL
  const partsRes = await fetch('/api/admin/upload/multipart/parts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, totalParts }),
  });

  const { parts: partUrls } = await partsRes.json();

  // 3. 逐一上傳每個分片
  const uploadedParts = [];
  for (let i = 0; i < totalParts; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const uploadRes = await fetch(partUrls[i].uploadUrl, {
      method: 'PUT',
      body: chunk,
    });

    const etag = uploadRes.headers.get('ETag');
    uploadedParts.push({
      PartNumber: i + 1,
      ETag: etag,
    });

    // 更新進度
    const progress = ((i + 1) / totalParts) * 100;
    console.log(\`進度: \${progress}%\`);
  }

  // 4. 完成上傳
  await fetch('/api/admin/upload/multipart/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, uploadId, parts: uploadedParts }),
  });

  return { publicUrl, key };
}
\`\`\`

## API 文件

### `generatePresignedUploadUrl(filename, contentType, subfolder?, expiresIn?, category?)`

產生預簽名上傳 URL（簡單上傳）。

**參數：**
- `filename` (string): 檔案名稱
- `contentType` (string): MIME type
- `subfolder` (string, optional): 子資料夾，預設 `images/`
- `expiresIn` (number, optional): URL 有效期（秒），預設根據 category 決定
- `category` (FileCategory, optional): `'image'` 或 `'document'`，預設 `'image'`

**返回：**
\`\`\`typescript
{
  uploadUrl: string;  // 用於 PUT 請求
  key: string;        // S3 object key
  publicUrl: string;  // 上傳完成後的公開 URL
  expiresIn: number;  // 過期時間（秒）
}
\`\`\`

### `initMultipartUpload(filename, contentType, fileSize, subfolder?)`

初始化 Multipart Upload。

**返回：**
\`\`\`typescript
{
  uploadId: string;   // Upload ID（後續操作需要）
  key: string;        // S3 object key
  chunkSize: number;  // 分片大小（10MB）
  totalParts: number; // 總分片數
  publicUrl: string;  // 上傳完成後的公開 URL
}
\`\`\`

### `getAllPartUploadUrls(key, uploadId, totalParts)`

取得所有分片的預簽名 URL。

**返回：**
\`\`\`typescript
{
  parts: Array<{
    partNumber: number;
    uploadUrl: string;
  }>;
}
\`\`\`

### `completeMultipartUpload(key, uploadId, parts)`

完成 Multipart Upload。

**參數：**
\`\`\`typescript
parts: Array<{
  PartNumber: number;
  ETag: string;  // 從上傳回應的 Header 取得
}>
\`\`\`

### `isValidImageType(contentType)`

驗證圖片類型。

**支援格式：** JPEG, JPG, PNG, GIF, WebP, SVG

### `isValidDocumentType(contentType)`

驗證文件類型。

**支援格式：** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP

### `isValidFileSize(size, maxSizeMB?)`

驗證檔案大小。

**預設最大：** 10MB

## 架構說明

### 圖片上傳（簡單上傳）

\`\`\`
專案上傳 → API 產生預簽名 URL → 前端直接上傳到 S3
                                    ↓
                    S3: company-assets-tw-2025/jianlin/images/xxx.jpg
\`\`\`

### 文件上傳（Multipart Upload）

\`\`\`
專案上傳 → API 初始化 → 取得分片 URL → 逐一上傳分片 → 完成上傳
                                        ↓
                        S3: company-assets-tw-2025/jianlin/documents/xxx.pdf
\`\`\`

**優點：**
- ✅ 支援 250MB 大檔案
- ✅ 斷點續傳（網路中斷可重試單一分片）
- ✅ 平行上傳（可同時上傳多個分片）
- ✅ 即時進度追蹤

## 完整範例

### React 圖片上傳組件

請參考：`apps/jianlin/components/admin/ImageUploader.tsx`

### React 文件上傳組件

請參考：`apps/jianlin/components/admin/DocumentUploader.tsx`

## 安全性

- ✅ 預簽名 URL 有時間限制（圖片 5 分鐘，文件 60 分鐘）
- ✅ 前端直接上傳，不經過 Next.js 伺服器
- ✅ IAM 權限最小化（只有上傳權限）
- ✅ 檔案類型和大小驗證
- ✅ 管理員權限檢查

## 效能最佳化

### 為什麼 Multipart Upload？

| 方案 | 簡單上傳 | Multipart Upload |
|------|---------|------------------|
| 適用大小 | < 10MB | 10MB - 5GB |
| 最大單次上傳 | 5GB | 5TB |
| 網路中斷 | 需重新上傳 | 只重傳失敗分片 |
| 上傳速度 | 單線程 | 可平行上傳 |
| 進度追蹤 | 無法分段 | 精確到每片 |

### 分片大小建議

- **10MB**（當前設定）：適合一般網路環境
- **5MB**：適合較慢網路
- **100MB**：適合高速網路和大檔案（需修改 `multipart.ts`）

## 故障排除

### 1. 上傳失敗：「AWS credentials 錯誤」

檢查 `.env.local` 是否設定正確：
\`\`\`bash
AWS_S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
\`\`\`

### 2. 上傳成功但圖片無法顯示

確認 S3 Bucket Policy 允許公開讀取：
\`\`\`json
{
  "Effect": "Allow",
  "Principal": "*",
  "Action": "s3:GetObject",
  "Resource": "arn:aws:s3:::company-assets-tw-2025/*"
}
\`\`\`

### 3. Multipart Upload 卡在某個分片

- 檢查網路連線
- 查看 Console 錯誤訊息
- 使用「取消上傳」重新開始

## 未來擴展

- [ ] 圖片壓縮和優化
- [ ] CDN 整合（CloudFront）
- [ ] 自動產生縮圖
- [ ] 圖片格式轉換（WebP）
- [ ] 影片上傳支援
- [ ] 進度持久化（localStorage）
- [ ] 平行上傳多個分片
