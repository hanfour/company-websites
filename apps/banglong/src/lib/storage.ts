/**
 * Storage Instance Configuration
 *
 * This file provides a singleton storage instance that can be configured
 * to use either Prisma (PostgreSQL) or JSON (S3).
 *
 * Switch between implementations by changing the STORAGE_TYPE environment variable:
 * - STORAGE_TYPE=prisma (default) - Uses PostgreSQL via Prisma
 * - STORAGE_TYPE=json - Uses JSON files stored in S3
 *
 * For JSON mode, you need to configure S3 credentials:
 * - S3_BUCKET - S3 bucket name
 * - S3_REGION - AWS region (e.g., us-east-1)
 * - S3_ACCESS_KEY_ID - AWS access key
 * - S3_SECRET_ACCESS_KEY - AWS secret key
 * - S3_ENDPOINT (optional) - Custom S3 endpoint for R2/MinIO
 */

import { createStorage, type IStorage } from '@repo/storage';

let storageInstance: IStorage | null = null;

export function getStorage(): IStorage {
  if (storageInstance) {
    return storageInstance;
  }

  const storageType = process.env.STORAGE_TYPE || 'prisma';

  if (storageType === 'json') {
    // Validate S3 configuration
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'JSON storage requires S3 configuration: S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY'
      );
    }

    // JSON + S3 Storage
    storageInstance = createStorage({
      type: 'json',
      s3: {
        bucket,
        region,
        accessKeyId,
        secretAccessKey,
        endpoint: process.env.S3_ENDPOINT, // Optional: for Cloudflare R2 or MinIO
      },
    });

    console.log(`✅ Storage initialized: JSON mode (bucket: ${bucket})`);
  } else {
    // Prisma + PostgreSQL (default)
    const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('Prisma storage requires DATABASE_URL or POSTGRES_PRISMA_URL');
    }

    storageInstance = createStorage({
      type: 'prisma',
      databaseUrl,
    });

    console.log('✅ Storage initialized: Prisma mode');
  }

  return storageInstance;
}

/**
 * Reset storage instance (useful for testing)
 */
export function resetStorage() {
  storageInstance = null;
}
