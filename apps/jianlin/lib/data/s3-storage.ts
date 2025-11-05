import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getBucketName, getProjectPrefix } from '@repo/upload-service';

/**
 * S3 数据存储服务
 * 用于存储 JSON 数据文件（公司资料、案例、租售物件、联系表单等）
 */

const s3Client = createS3Client();
const bucket = getBucketName();
const prefix = getProjectPrefix(); // e.g., "jianlin/"

/**
 * 从 S3 读取 JSON 文件
 */
export async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const fullKey = `${prefix}data/${key}`;
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fullKey,
    });

    const response = await s3Client.send(command);
    const content = await response.Body?.transformToString();

    if (!content) {
      return null;
    }

    return JSON.parse(content) as T;
  } catch (error: any) {
    // 如果文件不存在，返回 null（首次使用时）
    if (error.name === 'NoSuchKey') {
      return null;
    }
    console.error(`Error reading S3 JSON ${key}:`, error);
    throw error;
  }
}

/**
 * 写入 JSON 文件到 S3
 */
export async function writeJSON<T>(key: string, data: T): Promise<boolean> {
  try {
    const fullKey = `${prefix}data/${key}`;
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fullKey,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error writing S3 JSON ${key}:`, error);
    return false;
  }
}

/**
 * 删除 S3 文件
 */
export async function deleteJSON(key: string): Promise<boolean> {
  try {
    const fullKey = `${prefix}data/${key}`;
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fullKey,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error(`Error deleting S3 JSON ${key}:`, error);
    return false;
  }
}

/**
 * 列出指定前缀下的所有文件
 */
export async function listJSON(keyPrefix: string = ''): Promise<string[]> {
  try {
    const fullPrefix = `${prefix}data/${keyPrefix}`;
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: fullPrefix,
    });

    const response = await s3Client.send(command);
    const keys = response.Contents?.map(item => {
      // 移除前缀，返回相对路径
      return item.Key?.replace(`${prefix}data/`, '') || '';
    }).filter(key => key.endsWith('.json')) || [];

    return keys;
  } catch (error) {
    console.error(`Error listing S3 JSON files:`, error);
    return [];
  }
}
