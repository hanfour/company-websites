#!/usr/bin/env node

/**
 * 測試上傳 API
 *
 * 用法：node scripts/test-upload-api.js
 */

const testPresignAPI = async () => {
  console.log('🔍 測試預簽名上傳 API...\n');

  // 測試數據
  const testCases = [
    {
      name: '有效的 JPEG 圖片',
      data: {
        filename: 'test-image.jpg',
        contentType: 'image/jpeg',
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      shouldSucceed: true,
    },
    {
      name: '有效的 PNG 圖片',
      data: {
        filename: 'test-image.png',
        contentType: 'image/png',
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      shouldSucceed: true,
    },
    {
      name: '無效的檔案類型（PDF）',
      data: {
        filename: 'test-file.pdf',
        contentType: 'application/pdf',
        fileSize: 1 * 1024 * 1024,
      },
      shouldSucceed: false,
      expectedError: 'INVALID_FILE_TYPE',
    },
    {
      name: '檔案過大（15MB）',
      data: {
        filename: 'large-image.jpg',
        contentType: 'image/jpeg',
        fileSize: 15 * 1024 * 1024,
      },
      shouldSucceed: false,
      expectedError: 'FILE_TOO_LARGE',
    },
    {
      name: '缺少欄位',
      data: {
        filename: 'test.jpg',
        // 缺少 contentType 和 fileSize
      },
      shouldSucceed: false,
      expectedError: 'MISSING_FIELDS',
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const testCase of testCases) {
    console.log(`📝 測試案例: ${testCase.name}`);

    try {
      const response = await fetch('http://localhost:3000/api/admin/upload/presign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 注意：這裡需要有效的認證 token，如果測試失敗可能是因為沒有登入
        },
        body: JSON.stringify(testCase.data),
      });

      const result = await response.json();

      if (testCase.shouldSucceed) {
        if (response.ok && result.uploadUrl && result.publicUrl && result.key) {
          console.log(`✅ 成功: 取得預簽名 URL`);
          console.log(`   - Upload URL: ${result.uploadUrl.substring(0, 60)}...`);
          console.log(`   - Public URL: ${result.publicUrl}`);
          console.log(`   - S3 Key: ${result.key}`);
          console.log(`   - Expires In: ${result.expiresIn}s\n`);
          passedTests++;
        } else {
          console.log(`❌ 失敗: 預期成功但失敗`);
          console.log(`   Response:`, result);
          console.log();
          failedTests++;
        }
      } else {
        if (!response.ok && result.error === testCase.expectedError) {
          console.log(`✅ 成功: 正確返回錯誤 ${result.error}`);
          console.log(`   Message: ${result.message}\n`);
          passedTests++;
        } else if (!response.ok && response.status === 401) {
          console.log(`⚠️  跳過: 需要管理員權限（請先登入）`);
          console.log(`   提示: 這是正常的安全檢查\n`);
          // 不計入失敗
          continue;
        } else {
          console.log(`❌ 失敗: 預期錯誤 ${testCase.expectedError} 但得到 ${result.error}`);
          console.log(`   Response:`, result);
          console.log();
          failedTests++;
        }
      }
    } catch (error) {
      console.log(`❌ 失敗: ${error.message}\n`);
      failedTests++;
    }
  }

  console.log('\n📊 測試結果:');
  console.log(`   ✅ 通過: ${passedTests}`);
  console.log(`   ❌ 失敗: ${failedTests}`);
  console.log(`   總計: ${passedTests + failedTests}\n`);

  if (failedTests === 0) {
    console.log('🎉 所有測試通過！');
  } else {
    console.log('⚠️  有測試失敗，請檢查上述錯誤訊息');
  }
};

// 執行測試
testPresignAPI().catch(console.error);
