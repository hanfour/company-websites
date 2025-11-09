/**
 * Upload JSON exports to S3
 *
 * This script uploads the exported JSON files to S3/R2 for use with JSON storage mode.
 *
 * Usage:
 *   npx tsx scripts/upload-to-s3.ts
 *
 * Environment variables required:
 *   S3_BUCKET - S3 bucket name
 *   S3_REGION - AWS region
 *   S3_ACCESS_KEY_ID - AWS access key
 *   S3_SECRET_ACCESS_KEY - AWS secret key
 *   S3_ENDPOINT (optional) - Custom S3 endpoint for R2/MinIO
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

async function uploadToS3() {
  console.log('🚀 Starting upload to S3...\n');

  // Validate environment variables
  const bucket = process.env.S3_BUCKET;
  const region = process.env.S3_REGION;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const endpoint = process.env.S3_ENDPOINT;

  if (!bucket || !region || !accessKeyId || !secretAccessKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  // Create S3 client
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    ...(endpoint ? { endpoint } : {}),
  });

  const dataDir = path.join(process.cwd(), 'data-export');

  if (!fs.existsSync(dataDir)) {
    console.error('❌ data-export directory not found. Run export-to-json.ts first.');
    process.exit(1);
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.json'));

  console.log(`📁 Found ${files.length} JSON files to upload`);
  console.log(`📦 Target bucket: ${bucket}`);
  console.log(`🌍 Region: ${region}`);
  if (endpoint) {
    console.log(`🔗 Endpoint: ${endpoint}`);
  }
  console.log('');

  let successCount = 0;
  let failCount = 0;

  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      console.log(`⬆️  Uploading ${file}...`);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: file,
          Body: content,
          ContentType: 'application/json',
        })
      );

      console.log(`   ✅ Uploaded successfully`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to upload ${file}:`, error);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Upload Summary:');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${files.length}`);
  console.log('='.repeat(50));

  if (failCount > 0) {
    console.error('\n❌ Some uploads failed. Please check the errors above.');
    process.exit(1);
  }

  console.log('\n✨ All files uploaded successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Set STORAGE_TYPE=json in your .env file');
  console.log('   2. Restart your application');
  console.log('   3. Test all API endpoints');
}

uploadToS3().catch((error) => {
  console.error('\n❌ Upload failed:', error);
  process.exit(1);
});
