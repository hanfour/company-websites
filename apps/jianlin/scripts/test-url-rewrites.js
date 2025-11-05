#!/usr/bin/env node

/**
 * URL Rewrites 測試腳本
 *
 * 測試新舊 URL 是否都能正常訪問
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

const testCases = [
  // 公開頁面
  { name: '關於我們（新）', url: '/about', expected: 200 },
  { name: '關於我們（舊）', url: '/about_us', expected: 200 },
  { name: '聯絡我們（新）', url: '/contact', expected: 200 },
  { name: '聯絡我們（舊）', url: '/contact_us', expected: 200 },

  // 個案列表
  { name: '熱銷個案（新）', url: '/cases/featured', expected: 200 },
  { name: '熱銷個案（舊）', url: '/hot_list', expected: 200 },
  { name: '歷年個案（新）', url: '/cases/completed', expected: 200 },
  { name: '歷年個案（舊）', url: '/history_list', expected: 200 },
  { name: '個案首頁', url: '/cases', expected: 200 },

  // 物件列表
  { name: '物件列表（新）', url: '/properties', expected: 200 },
  { name: '物件列表（別名）', url: '/rentals', expected: 200 },
  { name: '物件列表（舊）', url: '/real_estate_list', expected: 200 },

  // 首頁
  { name: '首頁', url: '/', expected: 200 },

  // 後台
  { name: '後台首頁（新）', url: '/admin/dashboard', expected: 200 },
  { name: '後台首頁（舊）', url: '/admin', expected: 200 },
  { name: '後台熱銷列表（新）', url: '/admin/cases/featured', expected: 200 },
  { name: '後台熱銷列表（舊）', url: '/admin/hot_list', expected: 200 },
  { name: '後台物件列表（新）', url: '/admin/properties', expected: 200 },
  { name: '後台物件列表（舊）', url: '/admin/real_estate_list', expected: 200 },
];

async function testUrl(testCase) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${testCase.url}`;

    http.get(url, (res) => {
      const passed = res.statusCode === testCase.expected;
      resolve({
        ...testCase,
        actualStatus: res.statusCode,
        passed,
      });
    }).on('error', (err) => {
      resolve({
        ...testCase,
        actualStatus: 0,
        passed: false,
        error: err.message,
      });
    });
  });
}

async function runTests() {
  console.log('========================================');
  console.log('  URL Rewrites 測試');
  console.log('========================================\n');
  console.log(`測試目標: ${BASE_URL}\n`);

  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    process.stdout.write(`[${i + 1}/${testCases.length}] 測試: ${testCase.name}...`);

    const result = await testUrl(testCase);
    results.push(result);

    if (result.passed) {
      console.log(` ✅`);
    } else {
      console.log(` ❌ (預期: ${result.expected}, 實際: ${result.actualStatus})`);
      if (result.error) {
        console.log(`    錯誤: ${result.error}`);
      }
    }
  }

  // 統計結果
  console.log('\n========================================');
  console.log('  測試結果');
  console.log('========================================\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`總測試數: ${results.length}`);
  console.log(`✅ 通過: ${passed}`);
  console.log(`❌ 失敗: ${failed}\n`);

  if (failed > 0) {
    console.log('失敗的測試：');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name} (${r.url}): ${r.actualStatus}`);
    });
    console.log();
    process.exit(1);
  } else {
    console.log('🎉 所有測試通過！\n');
  }
}

// 執行測試
runTests().catch(error => {
  console.error('\n❌ 測試執行失敗！');
  console.error(error);
  process.exit(1);
});
