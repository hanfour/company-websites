/**
 * Storage Abstraction Layer Entry Point
 *
 * Usage:
 *   import { createStorage } from '@repo/storage';
 *
 *   // For Prisma
 *   const storage = createStorage({ type: 'prisma', databaseUrl: '...' });
 *
 *   // For JSON+S3
 *   const storage = createStorage({
 *     type: 'json',
 *     s3: { bucket: '...', region: '...', ... }
 *   });
 */

export * from './types';

export { createStorage } from './factory';
