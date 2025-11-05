#!/usr/bin/env node

/**
 * 驗證圖片 URL 腳本
 *
 * 功能：檢查 JSON 檔案中所有圖片 URL 是否可以訪問
 *
 * 用法：node scripts/verify-images.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 檢查 URL 是否可訪問
async function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { method: 'HEAD' }, (res) => {
      resolve({
        url,
        status: res.statusCode,
        accessible: res.statusCode === 200 || res.statusCode === 304,
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 0,
        accessible: false,
        error: error.message,
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        accessible: false,
        error: 'Timeout',
      });
    });
  });
}

// 收集所有圖片 URL
function collectImageUrls() {
  const urls = new Set();

  // 讀取 case.json
  const casePath = path.join(__dirname, '../lib/data/case.json');
  if (fs.existsSync(casePath)) {
    const cases = JSON.parse(fs.readFileSync(casePath, 'utf8'));
    cases.forEach(c => {
      if (c.slider && Array.isArray(c.slider)) {
        c.slider.forEach(img => {
          if (img.location) urls.add(img.location);
        });
      }
      if (c.src && Array.isArray(c.src)) {
        c.src.forEach(img => {
          if (img.location) urls.add(img.location);
        });
      }
    });
  }

  // 讀取 company.json
  const companyPath = path.join(__dirname, '../lib/data/company.json');
  if (fs.existsSync(companyPath)) {
    const company = JSON.parse(fs.readFileSync(companyPath, 'utf8'));

    function extractUrls(obj) {
      if (!obj || typeof obj !== 'object') return;

      if (Array.isArray(obj)) {
        obj.forEach(item => extractUrls(item));
        return;
      }

      if (obj.location) {
        urls.add(obj.location);
      }

      Object.values(obj).forEach(value => extractUrls(value));
    }

    extractUrls(company);
  }

  return Array.from(urls);
}

// 主函數
async function verify() {
  console.log('========================================');
  console.log('  圖片 URL 驗證工具');
  console.log('========================================\n');

  // 收集 URL
  console.log('📋 收集圖片 URL...\n');
  const urls = collectImageUrls();

  console.log(`找到 ${urls.length} 個唯一的圖片 URL\n`);

  // 分組統計
  const oldBucketUrls = urls.filter(url => url.includes('jienlin.s3'));
  const newBucketUrls = urls.filter(url => url.includes('company-assets-tw-2025'));

  console.log(`  舊 Bucket: ${oldBucketUrls.length} 個`);
  console.log(`  新 Bucket: ${newBucketUrls.length} 個\n`);

  // 檢查前 5 個 URL
  console.log('🔍 檢查前 5 個 URL...\n');

  for (let i = 0; i < Math.min(5, urls.length); i++) {
    const result = await checkUrl(urls[i]);
    console.log(`[${i + 1}/${urls.length}] ${result.accessible ? '✅' : '❌'} ${result.status || 'ERROR'} - ${urls[i]}`);
    if (!result.accessible && result.error) {
      console.log(`    錯誤: ${result.error}`);
    }
  }

  console.log('\n========================================');
  console.log('  驗證結果');
  console.log('========================================\n');

  console.log('📊 統計：');
  console.log(`  總圖片數: ${urls.length}`);
  console.log(`  ✅ 新 Bucket: ${newBucketUrls.length}`);
  console.log(`  ⚠️  舊 Bucket: ${oldBucketUrls.length}\n`);

  if (oldBucketUrls.length > 0) {
    console.log('⚠️  警告：仍有圖片使用舊 Bucket URL');
    console.log('   請執行 node scripts/update-image-urls.js 更新\n');
  } else {
    console.log('🎉 所有圖片 URL 已更新為新 Bucket！\n');
    console.log('下一步：');
    console.log('  1. 設定 AWS 環境變數：');
    console.log('     export AWS_ACCESS_KEY_ID=your_key');
    console.log('     export AWS_SECRET_ACCESS_KEY=your_secret');
    console.log('     export AWS_S3_BUCKET=company-assets-tw-2025');
    console.log('  2. 執行遷移：node scripts/migrate-images.js\n');
  }
}

// 執行驗證
verify().catch(error => {
  console.error('\n❌ 驗證失敗！');
  console.error(error);
  process.exit(1);
});
