#!/usr/bin/env node

/**
 * 解析 api_response.md 並轉換成新系統的資料格式
 */

const fs = require('fs');
const path = require('path');

const API_RESPONSE_FILE = path.join(__dirname, '..', 'api_response.md');
const OUTPUT_DIR = path.join(__dirname, '..', 'lib', 'data');

// 讀取 API response 檔案
const content = fs.readFileSync(API_RESPONSE_FILE, 'utf-8');

// 解析各個 API endpoint 的資料
function extractAPIData(content, startMarker, endMarker) {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return null;

  const jsonStart = content.indexOf('```', startIndex) + 3;
  const jsonEnd = endMarker ? content.indexOf(endMarker, jsonStart) : content.length;
  const jsonContent = content.substring(jsonStart, jsonEnd);
  const jsonEndIndex = jsonContent.lastIndexOf('```');

  try {
    return JSON.parse(jsonContent.substring(0, jsonEndIndex).trim());
  } catch (e) {
    console.error('解析 JSON 失敗:', e.message);
    return null;
  }
}

// 提取公司資料
const companyData = extractAPIData(
  content,
  '[GET]https://api.jianlin.com.tw/v1/company:',
  '[GET]https://api.jianlin.com.tw/v1/case/list:'
);

// 提取個案資料
const caseList = extractAPIData(
  content,
  '[GET]https://api.jianlin.com.tw/v1/case/list:',
  '[GET]https://api.jianlin.com.tw/v1/rental/list'
);

// 提取租售資料
const rentalList = extractAPIData(
  content,
  '[GET]https://api.jianlin.com.tw/v1/rental/list:',
  null
);

console.log('✅ Company 資料:', companyData ? 'OK' : 'FAIL');
console.log('✅ Case 列表:', caseList ? `${caseList.length} 筆` : 'FAIL');
console.log('✅ Rental 列表:', rentalList ? `${rentalList.length} 筆` : 'FAIL');

// 轉換 Case 資料格式 - 保留完整原始数据
function convertCaseData(caseList) {
  if (!caseList || !Array.isArray(caseList)) return [];

  return caseList.map((item) => {
    const isHot = item.status === 0; // status 0 = hot, 1 = history
    const numberID = isHot ? `hot${String(item.id).padStart(3, '0')}` : `history${String(item.id).padStart(3, '0')}`;

    return {
      // 系统字段
      numberID,
      type: isHot ? 'hot' : 'history',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      // 原始 API 字段 - 完整保留
      id: item.id,
      name: item.name || '',
      sub: item.sub || '',
      caption: item.caption || '',
      outline: item.outline || '',
      address: item.address || '',

      // 图片数组 - 保留完整对象
      slider: item.slider || [],
      src: item.src || [],

      // 外部链接
      broking: item.broking || '',
      facebook: item.facebook || '',
      detailed: item.detailed || '',

      // 状态和时间
      status: item.status,
      data_uploader: item.data_uploader || '',
      data_editor: item.data_editor || ''
    };
  });
}

// 轉換 Rental 資料格式
function convertRentalData(rentalList) {
  if (!rentalList || !Array.isArray(rentalList)) return [];

  return rentalList.map((item, index) => {
    const numberID = `rental${String(item.id || index + 1).padStart(3, '0')}`;

    // 提取圖片列表
    const images = (item.src || []).map(img => img.src || img.location);

    return {
      numberID,
      title: item.name || '',
      subtitle: item.sub ? item.sub.replace(/<\/?p>/g, '').trim() : '',
      content: item.caption || '',
      images,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

// 轉換資料
const convertedCases = convertCaseData(caseList);
const convertedRentals = convertRentalData(rentalList);

// 分離熱銷和歷年個案
const hotCases = convertedCases.filter(c => c.type === 'hot');
const historyCases = convertedCases.filter(c => c.type === 'history');

console.log('\n📊 轉換結果:');
console.log(`  熱銷個案: ${hotCases.length} 筆`);
console.log(`  歷年個案: ${historyCases.length} 筆`);
console.log(`  租售物件: ${convertedRentals.length} 筆`);

// 顯示個案列表
console.log('\n📋 熱銷個案:');
hotCases.forEach((c, i) => {
  console.log(`  ${i + 1}. [${c.numberID}] ${c.name} (slider: ${c.slider.length}, src: ${c.src.length})`);
});

console.log('\n📋 歷年個案:');
historyCases.forEach((c, i) => {
  console.log(`  ${i + 1}. [${c.numberID}] ${c.name} (slider: ${c.slider.length}, src: ${c.src.length})`);
});

console.log('\n📋 租售物件:');
convertedRentals.forEach((r, i) => {
  console.log(`  ${i + 1}. [${r.numberID}] ${r.title} (${r.images ? r.images.length : 0} 張圖片)`);
});

// 儲存資料
function saveData() {
  // 合併所有個案到 case.json
  const allCases = [...hotCases, ...historyCases];
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'case.json'),
    JSON.stringify(allCases, null, 2),
    'utf-8'
  );
  console.log('\n✅ 已儲存: lib/data/case.json');

  // 儲存租售物件到 rental.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'rental.json'),
    JSON.stringify(convertedRentals, null, 2),
    'utf-8'
  );
  console.log('✅ 已儲存: lib/data/rental.json');

  // 更新 company.json（如果有新資料）
  if (companyData) {
    const companyPath = path.join(OUTPUT_DIR, 'company.json');
    let existingCompany = {};

    if (fs.existsSync(companyPath)) {
      existingCompany = JSON.parse(fs.readFileSync(companyPath, 'utf-8'));
    }

    // 合併資料，保留現有的 carousel 和其他欄位
    const updatedCompany = {
      ...existingCompany,
      ...companyData,
      carousel: existingCompany.carousel || companyData.carousel || {}
    };

    // 修正首頁連結使用正確的 numberID
    if (updatedCompany.home && Array.isArray(updatedCompany.home)) {
      updatedCompany.home = updatedCompany.home.map(item => {
        if (item.link === '/hot/1') {
          return { ...item, link: '/hot/hot001' };
        }
        if (item.link === '/history/18') {
          return { ...item, link: '/history/history018' };
        }
        return item;
      });
    }

    fs.writeFileSync(
      companyPath,
      JSON.stringify(updatedCompany, null, 2),
      'utf-8'
    );
    console.log('✅ 已更新: lib/data/company.json');
    console.log('✅ 已修正首頁連結');
  }

  console.log('\n🎉 資料匯入完成！');
  console.log('\n下一步：');
  console.log('1. 檢查 lib/data/case.json 和 lib/data/rental.json');
  console.log('2. 訪問 http://localhost:3000/hot_list 查看熱銷個案');
  console.log('3. 訪問 http://localhost:3000/history_list 查看歷年個案');
  console.log('4. 訪問 http://localhost:3000/real_estate_list 查看租售物件');
}

saveData();
