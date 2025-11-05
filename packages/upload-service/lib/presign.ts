import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketName, generateS3Key, getPublicUrl } from './s3-client';

export interface PresignedUploadResult {
  /** 預簽名上傳 URL（用於 PUT 請求） */
  uploadUrl: string;
  /** S3 object key */
  key: string;
  /** 上傳完成後的公開 URL */
  publicUrl: string;
  /** 上傳 URL 過期時間（秒） */
  expiresIn: number;
}

export type FileCategory = 'image' | 'document';

/**
 * 產生預簽名上傳 URL
 *
 * @param filename - 原始檔案名稱
 * @param contentType - MIME type（例如：image/jpeg）
 * @param subfolder - 子資料夾（預設：images/）
 * @param expiresIn - URL 有效期（秒，預設：5 分鐘）
 * @param category - 檔案類別（image 或 document，用於決定過期時間）
 * @returns 預簽名 URL 資訊
 */
export async function generatePresignedUploadUrl(
  filename: string,
  contentType: string,
  subfolder: string = 'images/',
  expiresIn?: number,
  category: FileCategory = 'image'
): Promise<PresignedUploadResult> {
  const s3Client = createS3Client();
  const bucket = getBucketName();

  // 根據檔案類別決定過期時間
  // 圖片：5 分鐘（預設）
  // 文件：60 分鐘（大檔案需要更長時間）
  const defaultExpiresIn = category === 'document' ? 3600 : 300;
  const actualExpiresIn = expiresIn || defaultExpiresIn;

  // 生成唯一的檔案名稱（加上時間戳避免衝突）
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${filename}`;
  const key = generateS3Key(uniqueFilename, subfolder);

  // 建立 PutObject 命令
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    // 設定 ACL 為 public-read（或者依賴 bucket policy）
    // ACL: 'public-read',
  });

  // 生成預簽名 URL
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: actualExpiresIn });
  const publicUrl = getPublicUrl(key);

  return {
    uploadUrl,
    key,
    publicUrl,
    expiresIn: actualExpiresIn,
  };
}

/**
 * 驗證檔案類型是否為允許的圖片格式
 */
export function isValidImageType(contentType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  return allowedTypes.includes(contentType.toLowerCase());
}

/**
 * 驗證檔案類型是否為允許的文件格式
 */
export function isValidDocumentType(contentType: string): boolean {
  const allowedTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'text/plain', // .txt
    'application/zip',
    'application/x-zip-compressed',
  ];

  return allowedTypes.includes(contentType.toLowerCase());
}

/**
 * 驗證檔案大小（預設最大 10MB）
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}
