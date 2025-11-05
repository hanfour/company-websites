import { S3Client } from '@aws-sdk/client-s3';

/**
 * 建立 S3 客戶端實例
 * 使用環境變數設定 AWS credentials 和 region
 */
export function createS3Client(): S3Client {
  const region = process.env.AWS_S3_REGION || 'ap-northeast-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing AWS credentials. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.'
    );
  }

  return new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * 取得 S3 bucket 名稱
 */
export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET;

  if (!bucket) {
    throw new Error('Missing AWS_S3_BUCKET environment variable');
  }

  return bucket;
}

/**
 * 取得專案的上傳路徑前綴
 * 例如：jianlin/ 或 banlong/
 */
export function getProjectPrefix(): string {
  return process.env.AWS_S3_PREFIX || '';
}

/**
 * 產生完整的 S3 object key
 *
 * @param filename - 檔案名稱（例如：image.jpg）
 * @param subfolder - 子資料夾（選填，例如：images/）
 * @returns 完整的 S3 key（例如：jianlin/images/image.jpg）
 */
export function generateS3Key(filename: string, subfolder: string = 'images/'): string {
  const prefix = getProjectPrefix();
  const folder = subfolder.endsWith('/') ? subfolder : `${subfolder}/`;

  return `${prefix}${folder}${filename}`;
}

/**
 * 產生檔案的公開 URL
 *
 * @param key - S3 object key
 * @returns 完整的公開 URL
 */
export function getPublicUrl(key: string): string {
  const bucket = getBucketName();
  const region = process.env.AWS_S3_REGION || 'ap-northeast-1';

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}
