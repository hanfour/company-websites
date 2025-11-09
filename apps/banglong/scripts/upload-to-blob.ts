/**
 * Upload JSON exports to Vercel Blob
 *
 * This script uploads the exported JSON files to Vercel Blob as backup.
 *
 * Usage:
 *   npx tsx scripts/upload-to-blob.ts
 */

import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

async function uploadToBlob() {
  console.log('🚀 Starting upload to Vercel Blob...\n');

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('❌ BLOB_READ_WRITE_TOKEN environment variable is required');
    process.exit(1);
  }

  const dataDir = path.join(process.cwd(), 'data-export');

  if (!fs.existsSync(dataDir)) {
    console.error('❌ data-export directory not found. Run export-to-json.ts first.');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} JSON files to upload\n`);

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const blob = new Blob([content], { type: 'application/json' });

      console.log(`⬆️  Uploading ${file}...`);

      const result = await put(`data/${file}`, blob, {
        access: 'public',
        token,
      });

      console.log(`   ✅ Uploaded to: ${result.url}`);
    } catch (error) {
      console.error(`   ❌ Failed to upload ${file}:`, error);
    }
  }

  console.log('\n✨ Upload complete!');
  console.log('\n📝 Note: These files are now backed up to Vercel Blob.');
  console.log('You can download them later if needed for disaster recovery.');
}

uploadToBlob().catch((error) => {
  console.error(error);
  process.exit(1);
});
