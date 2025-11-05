/**
 * 数据迁移脚本：将本地 JSON 文件上传到 S3
 *
 * 使用方式:
 * 1. 确保已配置 .env.local
 * 2. 运行: npm run migrate:s3
 */

import fs from 'fs';
import path from 'path';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded environment variables from .env.local\n');
}

const DATA_DIR = path.join(process.cwd(), 'lib', 'data');
const FILES_TO_MIGRATE = [
  'company.json',
  'case.json',
  'rental.json',
  'user.json',
];

async function migrateToS3() {
  // Create S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'ap-northeast-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const bucket = process.env.AWS_S3_BUCKET!;
  const prefix = process.env.AWS_S3_PREFIX || '';

  console.log(`🚀 开始迁移数据到 S3: ${bucket}/${prefix}data/\n`);

  let successCount = 0;
  let failCount = 0;

  for (const filename of FILES_TO_MIGRATE) {
    try {
      const filePath = path.join(DATA_DIR, filename);

      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        console.log(`⏭️  跳过 ${filename} (文件不存在)`);
        continue;
      }

      // 读取本地文件
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // 上传到 S3
      const key = `${prefix}data/${filename}`;
      console.log(`📤 上传 ${filename} 到 ${key}...`);

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json',
      });

      await s3Client.send(command);
      console.log(`✅ ${filename} 上传成功\n`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${filename} 处理失败:`, error);
      failCount++;
    }
  }

  console.log('\n📊 迁移完成!');
  console.log(`✅ 成功: ${successCount} 个文件`);
  console.log(`❌ 失败: ${failCount} 个文件`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// 执行迁移
migrateToS3().catch((error) => {
  console.error('❌ 迁移失败:', error);
  process.exit(1);
});
