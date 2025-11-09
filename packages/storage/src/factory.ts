/**
 * Storage Factory
 *
 * Simple factory pattern - no magic, no complexity.
 * Give it a config, get back the right implementation.
 */

import type { IStorage, StorageConfig } from './types';
import { PrismaStorage } from './implementations/prisma-storage';
import { JSONStorage } from './implementations/json-storage';

export function createStorage(config: StorageConfig): IStorage {
  switch (config.type) {
    case 'prisma':
      if (!config.databaseUrl) {
        throw new Error('Database URL is required for Prisma storage');
      }
      return new PrismaStorage(config.databaseUrl);

    case 'json':
      if (!config.s3) {
        throw new Error('S3 configuration is required for JSON storage');
      }
      return new JSONStorage(config.s3, config.concurrency);

    default:
      throw new Error(`Unknown storage type: ${(config as any).type}`);
  }
}
