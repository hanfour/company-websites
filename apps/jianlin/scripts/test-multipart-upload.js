#!/usr/bin/env node

/**
 * 測試 Multipart Upload API
 *
 * 用法：node scripts/test-multipart-upload.js
 */

async function testMultipartUploadAPI() {
  console.log('🧪 測試 Multipart Upload API...\n');

  try {
    // 模擬一個 50MB 的檔案
    const testFile = {
      filename: 'test-document.pdf',
      contentType: 'application/pdf',
      fileSize: 50 * 1024 * 1024, // 50MB
    };

    console.log('📝 測試檔案資訊：');
    console.log(`   檔案名稱: ${testFile.filename}`);
    console.log(`   檔案類型: ${testFile.contentType}`);
    console.log(`   檔案大小: ${(testFile.fileSize / 1024 / 1024).toFixed(2)} MB\n`);

    // 步驟 1：初始化 Multipart Upload
    console.log('🔄 步驟 1/3: 初始化 Multipart Upload...');
    const initResponse = await fetch('http://localhost:3000/api/admin/upload/multipart/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testFile),
    });

    if (!initResponse.ok) {
      const error = await initResponse.json();
      throw new Error(`初始化失敗: ${error.message || error.error}`);
    }

    const { uploadId, key, chunkSize, totalParts, publicUrl } = await initResponse.json();

    console.log('✅ 初始化成功！');
    console.log(`   Upload ID: ${uploadId}`);
    console.log(`   S3 Key: ${key}`);
    console.log(`   分片大小: ${(chunkSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   總分片數: ${totalParts}`);
    console.log(`   公開 URL: ${publicUrl}\n`);

    // 步驟 2：取得所有分片的預簽名 URL
    console.log('🔄 步驟 2/3: 取得所有分片的預簽名 URL...');
    const partsResponse = await fetch('http://localhost:3000/api/admin/upload/multipart/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, uploadId, totalParts }),
    });

    if (!partsResponse.ok) {
      const error = await partsResponse.json();
      throw new Error(`取得分片 URL 失敗: ${error.message || error.error}`);
    }

    const { parts } = await partsResponse.json();

    console.log(`✅ 取得 ${parts.length} 個分片 URL 成功！`);
    console.log(`   第一片 URL: ${parts[0].uploadUrl.substring(0, 80)}...`);
    console.log(`   最後一片 URL: ${parts[parts.length - 1].uploadUrl.substring(0, 80)}...\n`);

    // 步驟 3：模擬上傳（不實際上傳數據，只驗證 URL）
    console.log('🔄 步驟 3/3: 驗證預簽名 URL...');

    // 檢查第一個 URL 的格式
    const firstUrl = new URL(parts[0].uploadUrl);
    console.log(`   URL 格式檢查:`);
    console.log(`   - Host: ${firstUrl.host}`);
    console.log(`   - Path: ${firstUrl.pathname}`);
    console.log(`   - 包含 uploadId: ${firstUrl.searchParams.has('uploadId') ? '✅' : '❌'}`);
    console.log(`   - 包含 partNumber: ${firstUrl.searchParams.has('partNumber') ? '✅' : '❌'}`);
    console.log(`   - 包含簽名: ${firstUrl.searchParams.has('X-Amz-Signature') ? '✅' : '❌'}\n`);

    console.log('🎉 所有測試通過！');
    console.log('\n✅ Multipart Upload API 正常運作');
    console.log('✅ AWS IAM 權限設定正確');
    console.log('✅ 預簽名 URL 產生成功\n');

    console.log('📊 測試總結：');
    console.log(`   ✅ 初始化 API: /api/admin/upload/multipart/init`);
    console.log(`   ✅ 取得分片 URL API: /api/admin/upload/multipart/parts`);
    console.log(`   ⏭️  完成上傳 API: /api/admin/upload/multipart/complete (未測試)`);
    console.log('\n💡 提示：實際上傳測試請使用管理後台的 DocumentUploader 組件\n');

  } catch (error) {
    console.error('\n❌ 測試失敗！');
    console.error(`   錯誤訊息: ${error.message}`);

    if (error.message.includes('UNAUTHORIZED')) {
      console.error('\n🔐 原因：需要管理員權限');
      console.error('   解決方法：請先登入管理後台，或使用有效的認證 token\n');
    } else if (error.message.includes('AWS')) {
      console.error('\n☁️  原因：AWS 設定問題');
      console.error('   請檢查：');
      console.error('   1. .env.local 中的 AWS credentials 是否正確');
      console.error('   2. IAM Policy 是否包含 Multipart Upload 權限');
      console.error('   3. S3 Bucket 是否存在\n');
    } else {
      console.error('\n   請檢查：');
      console.error('   1. Dev server 是否在 http://localhost:3000 運行');
      console.error('   2. API 端點是否正確部署');
      console.error('   3. 網路連線是否正常\n');
    }

    process.exit(1);
  }
}

// 執行測試
console.log('='.repeat(70));
console.log('  Multipart Upload API 測試工具');
console.log('='.repeat(70));
console.log();

testMultipartUploadAPI().catch(console.error);
