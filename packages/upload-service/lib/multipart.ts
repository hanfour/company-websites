import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createS3Client, getBucketName, generateS3Key, getPublicUrl } from './s3-client';

export interface MultipartUploadInitResult {
  /** Upload ID（用於後續操作） */
  uploadId: string;
  /** S3 object key */
  key: string;
  /** 分片大小（bytes） */
  chunkSize: number;
  /** 總分片數 */
  totalParts: number;
  /** 公開 URL */
  publicUrl: string;
}

export interface PartUploadUrl {
  /** 分片編號（從 1 開始） */
  partNumber: number;
  /** 預簽名上傳 URL */
  uploadUrl: string;
}

/**
 * 初始化 Multipart Upload
 *
 * @param filename - 檔案名稱
 * @param contentType - MIME type
 * @param fileSize - 檔案大小（bytes）
 * @param subfolder - 子資料夾
 * @returns Upload ID 和相關資訊
 */
export async function initMultipartUpload(
  filename: string,
  contentType: string,
  fileSize: number,
  subfolder: string = 'documents/'
): Promise<MultipartUploadInitResult> {
  const s3Client = createS3Client();
  const bucket = getBucketName();

  // 生成唯一檔名
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${filename}`;
  const key = generateS3Key(uniqueFilename, subfolder);

  // 初始化 Multipart Upload
  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const response = await s3Client.send(command);

  if (!response.UploadId) {
    throw new Error('Failed to initialize multipart upload');
  }

  // 計算分片（每片 10MB，AWS 建議 5MB-5GB）
  const chunkSize = 10 * 1024 * 1024; // 10MB
  const totalParts = Math.ceil(fileSize / chunkSize);

  return {
    uploadId: response.UploadId,
    key,
    chunkSize,
    totalParts,
    publicUrl: getPublicUrl(key),
  };
}

/**
 * 產生單一分片的預簽名 URL
 *
 * @param key - S3 object key
 * @param uploadId - Upload ID
 * @param partNumber - 分片編號（從 1 開始）
 * @param expiresIn - URL 有效期（秒，預設 1 小時）
 * @returns 預簽名 URL
 */
export async function getPartUploadUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresIn: number = 3600
): Promise<string> {
  const s3Client = createS3Client();
  const bucket = getBucketName();

  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    PartNumber: partNumber,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * 批量產生所有分片的預簽名 URL
 *
 * @param key - S3 object key
 * @param uploadId - Upload ID
 * @param totalParts - 總分片數
 * @returns 所有分片的 URL
 */
export async function getAllPartUploadUrls(
  key: string,
  uploadId: string,
  totalParts: number
): Promise<PartUploadUrl[]> {
  const urls: PartUploadUrl[] = [];

  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const uploadUrl = await getPartUploadUrl(key, uploadId, partNumber);
    urls.push({ partNumber, uploadUrl });
  }

  return urls;
}

/**
 * 完成 Multipart Upload
 *
 * @param key - S3 object key
 * @param uploadId - Upload ID
 * @param parts - 已上傳的分片資訊（partNumber 和 ETag）
 */
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: Array<{ PartNumber: number; ETag: string }>
): Promise<void> {
  const s3Client = createS3Client();
  const bucket = getBucketName();

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
    },
  });

  await s3Client.send(command);
}

/**
 * 取消 Multipart Upload
 *
 * @param key - S3 object key
 * @param uploadId - Upload ID
 */
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  const s3Client = createS3Client();
  const bucket = getBucketName();

  const command = new AbortMultipartUploadCommand({
    Bucket: bucket,
    Key: key,
    UploadId: uploadId,
  });

  await s3Client.send(command);
}
