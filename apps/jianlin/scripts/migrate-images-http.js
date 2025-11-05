#!/usr/bin/env node

/**
 * 圖片遷移腳本（HTTP 方式）
 *
 * 功能：
 * 1. 從舊 S3 bucket 的公開 URL 下載圖片
 * 2. 上傳到新 bucket
 *
 * 用法：node scripts/migrate-images-http.js
 */

const path = require('path');
const fs = require('fs');
const https = require('https');

// 載入環境變數
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');

// 設定
const OLD_BUCKET_URL = 'https://jienlin.s3-ap-northeast-1.amazonaws.com/';
const NEW_BUCKET = process.env.AWS_S3_BUCKET || 'company-assets-tw-2025';
const NEW_PREFIX = 'jianlin/';
const REGION = 'ap-northeast-1';

// 建立 S3 客戶端
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// 下載圖片
async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
}

// 收集所有需要遷移的圖片
function collectImageUrls() {
  const images = new Set();

  // 讀取 case.json
  const casePath = path.join(__dirname, '../lib/data/case.json');
  if (fs.existsSync(casePath)) {
    const cases = JSON.parse(fs.readFileSync(casePath, 'utf8'));
    cases.forEach(c => {
      // slider 圖片
      if (c.slider && Array.isArray(c.slider)) {
        c.slider.forEach(img => {
          if (img.src && img.src.startsWith('images/')) {
            images.add(img.src);
          }
        });
      }
      // src 圖片
      if (c.src && Array.isArray(c.src)) {
        c.src.forEach(img => {
          if (img.src && img.src.startsWith('images/')) {
            images.add(img.src);
          }
        });
      }
    });
  }

  // 讀取 company.json
  const companyPath = path.join(__dirname, '../lib/data/company.json');
  if (fs.existsSync(companyPath)) {
    const company = JSON.parse(fs.readFileSync(companyPath, 'utf8'));

    // home 圖片
    if (company.home && Array.isArray(company.home)) {
      company.home.forEach(item => {
        if (item.src && item.src.startsWith('images/')) {
          images.add(item.src);
        }
      });
    }

    // carousel 圖片
    if (company.carousel) {
      ['home', 'hot', 'history'].forEach(key => {
        if (company.carousel[key] && Array.isArray(company.carousel[key])) {
          company.carousel[key].forEach(item => {
            if (item.src && item.src.startsWith('images/')) {
              images.add(item.src);
            }
          });
        }
      });
    }

    // about 圖片
    if (company.about && Array.isArray(company.about)) {
      company.about.forEach(item => {
        if (item.src && item.src.startsWith('images/')) {
          images.add(item.src);
        }
      });
    }
  }

  return Array.from(images);
}

// 上傳單個圖片
async function uploadImage(srcKey) {
  const destKey = `${NEW_PREFIX}${srcKey}`;
  const sourceUrl = `${OLD_BUCKET_URL}${srcKey}`;

  try {
    // 檢查目標檔案是否已存在
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: NEW_BUCKET,
        Key: destKey,
      }));
      console.log(`  ⏭️  跳過（已存在）: ${destKey}`);
      return { success: true, skipped: true };
    } catch (err) {
      // 檔案不存在，繼續上傳
    }

    // 下載圖片
    console.log(`  📥 下載: ${sourceUrl}`);
    const imageBuffer = await downloadImage(sourceUrl);

    // 判斷 Content-Type
    const ext = srcKey.split('.').pop().toLowerCase();
    const contentTypeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    // 上傳到新 bucket
    await s3Client.send(new PutObjectCommand({
      Bucket: NEW_BUCKET,
      Key: destKey,
      Body: imageBuffer,
      ContentType: contentType,
    }));

    console.log(`  ✅ 成功: ${srcKey} -> ${destKey}`);
    return { success: true, skipped: false };
  } catch (error) {
    console.error(`  ❌ 失敗: ${srcKey}`);
    console.error(`     錯誤: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// 主函數
async function migrate() {
  console.log('========================================');
  console.log('  圖片遷移工具 (HTTP 方式)');
  console.log('========================================\n');

  console.log(`來源 URL: ${OLD_BUCKET_URL}`);
  console.log(`目標 Bucket: ${NEW_BUCKET}`);
  console.log(`目標路徑前綴: ${NEW_PREFIX}\n`);

  // 收集圖片
  console.log('📋 收集需要遷移的圖片...\n');
  const images = collectImageUrls();

  if (images.length === 0) {
    console.log('⚠️  沒有找到需要遷移的圖片');
    return;
  }

  console.log(`找到 ${images.length} 個圖片需要遷移\n`);

  // 遷移圖片
  console.log('🚀 開始遷移...\n');
  const results = {
    total: images.length,
    success: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    console.log(`[${i + 1}/${images.length}] 處理: ${img}`);

    const result = await uploadImage(img);

    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.success++;
      }
    } else {
      results.failed++;
      results.errors.push({ image: img, error: result.error });
    }
  }

  // 輸出結果
  console.log('\n========================================');
  console.log('  遷移結果');
  console.log('========================================\n');
  console.log(`總計: ${results.total}`);
  console.log(`✅ 成功: ${results.success}`);
  console.log(`⏭️  跳過: ${results.skipped}`);
  console.log(`❌ 失敗: ${results.failed}\n`);

  if (results.errors.length > 0) {
    console.log('失敗的圖片：');
    results.errors.forEach(({ image, error }) => {
      console.log(`  - ${image}: ${error}`);
    });
    console.log();
  }

  if (results.failed === 0) {
    console.log('🎉 所有圖片遷移完成！\n');
  } else {
    console.log('⚠️  部分圖片遷移失敗，請檢查錯誤訊息\n');
    process.exit(1);
  }
}

// 執行遷移
migrate().catch(error => {
  console.error('\n❌ 遷移失敗！');
  console.error(error);
  process.exit(1);
});
