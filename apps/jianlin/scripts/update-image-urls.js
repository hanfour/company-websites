#!/usr/bin/env node

/**
 * 更新 JSON 檔案中的圖片 URL
 *
 * 功能：將所有圖片 URL 從舊 bucket 更新為新 bucket
 *
 * 用法：node scripts/update-image-urls.js
 */

const fs = require('fs');
const path = require('path');

// 設定
const OLD_BUCKET_URL = 'https://jienlin.s3-ap-northeast-1.amazonaws.com/';
const NEW_BUCKET = process.env.AWS_S3_BUCKET || 'company-assets-tw-2025';
const NEW_BUCKET_URL = `https://${NEW_BUCKET}.s3.ap-northeast-1.amazonaws.com/jianlin/`;

// 更新單個圖片物件
function updateImageObject(img) {
  if (!img || typeof img !== 'object') return img;

  const updated = { ...img };

  // 如果有 src 欄位且以 images/ 開頭，更新 location
  if (updated.src && updated.src.startsWith('images/')) {
    updated.location = `${NEW_BUCKET_URL}${updated.src}`;
  }
  // 如果只有 location 且包含舊 bucket
  else if (updated.location && updated.location.includes('jienlin.s3')) {
    updated.location = updated.location.replace(OLD_BUCKET_URL, NEW_BUCKET_URL);
  }

  return updated;
}

// 更新 case.json
function updateCaseJson() {
  const filePath = path.join(__dirname, '../lib/data/case.json');

  if (!fs.existsSync(filePath)) {
    console.log('  ⚠️  case.json 不存在，跳過');
    return { updated: 0, total: 0 };
  }

  const cases = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = 0;
  let total = 0;

  cases.forEach(c => {
    // 更新 slider
    if (c.slider && Array.isArray(c.slider)) {
      c.slider = c.slider.map(img => {
        total++;
        const newImg = updateImageObject(img);
        if (newImg.location !== img.location) updated++;
        return newImg;
      });
    }

    // 更新 src
    if (c.src && Array.isArray(c.src)) {
      c.src = c.src.map(img => {
        total++;
        const newImg = updateImageObject(img);
        if (newImg.location !== img.location) updated++;
        return newImg;
      });
    }
  });

  // 寫回檔案
  fs.writeFileSync(filePath, JSON.stringify(cases, null, 2), 'utf8');

  console.log(`  ✅ case.json: 更新 ${updated}/${total} 個圖片 URL`);
  return { updated, total };
}

// 更新 company.json
function updateCompanyJson() {
  const filePath = path.join(__dirname, '../lib/data/company.json');

  if (!fs.existsSync(filePath)) {
    console.log('  ⚠️  company.json 不存在，跳過');
    return { updated: 0, total: 0 };
  }

  const company = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updated = 0;
  let total = 0;

  // 遞迴更新物件中的所有圖片
  function updateNestedImages(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(item => updateNestedImages(item));
    }

    // 如果是圖片物件（有 src 和 location）
    if (obj.src && obj.location) {
      total++;
      const newObj = updateImageObject(obj);
      if (newObj.location !== obj.location) updated++;
      return newObj;
    }

    // 遞迴處理所有屬性
    const result = {};
    for (const key in obj) {
      result[key] = updateNestedImages(obj[key]);
    }
    return result;
  }

  // 更新整個 company 物件
  const updatedCompany = updateNestedImages(company);

  // 寫回檔案
  fs.writeFileSync(filePath, JSON.stringify(updatedCompany, null, 2), 'utf8');

  console.log(`  ✅ company.json: 更新 ${updated}/${total} 個圖片 URL`);
  return { updated, total };
}

// 主函數
function updateUrls() {
  console.log('========================================');
  console.log('  更新圖片 URL 工具');
  console.log('========================================\n');

  console.log(`舊 URL: ${OLD_BUCKET_URL}`);
  console.log(`新 URL: ${NEW_BUCKET_URL}\n`);

  console.log('🔄 開始更新...\n');

  // 建立備份
  console.log('📦 建立備份...');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../lib/data/backup', timestamp);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  ['case.json', 'company.json'].forEach(file => {
    const src = path.join(__dirname, '../lib/data', file);
    if (fs.existsSync(src)) {
      const dest = path.join(backupDir, file);
      fs.copyFileSync(src, dest);
    }
  });

  console.log(`  ✅ 備份已儲存至: ${backupDir}\n`);

  // 更新檔案
  console.log('🔄 更新 JSON 檔案...\n');

  const caseResult = updateCaseJson();
  const companyResult = updateCompanyJson();

  const totalUpdated = caseResult.updated + companyResult.updated;
  const totalImages = caseResult.total + companyResult.total;

  // 輸出結果
  console.log('\n========================================');
  console.log('  更新結果');
  console.log('========================================\n');
  console.log(`總計圖片: ${totalImages}`);
  console.log(`✅ 已更新: ${totalUpdated}`);
  console.log(`⏭️  跳過: ${totalImages - totalUpdated}\n`);

  if (totalUpdated > 0) {
    console.log('🎉 URL 更新完成！');
    console.log('\n⚠️  重要提醒：');
    console.log('  1. 請檢查更新後的檔案是否正確');
    console.log('  2. 如有問題，可從備份資料夾還原');
    console.log(`  3. 備份位置: ${backupDir}\n`);
  } else {
    console.log('ℹ️  沒有 URL 需要更新\n');
  }
}

// 執行更新
try {
  updateUrls();
} catch (error) {
  console.error('\n❌ 更新失敗！');
  console.error(error);
  process.exit(1);
}
