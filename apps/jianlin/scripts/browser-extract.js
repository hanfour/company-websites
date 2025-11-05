// 建林工業 - 瀏覽器資料提取腳本
// 在 https://www.jianlin.com.tw 的瀏覽器 Console 中執行此腳本

(function() {
  console.log('🚀 開始提取建林工業資料...');

  const extractedData = {
    hotCases: [],
    historyCases: [],
    rentals: []
  };

  // 方法 1: 嘗試從 Redux Store 提取
  try {
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      const state = window.__REDUX_DEVTOOLS_EXTENSION__.store.getState();
      console.log('✅ 找到 Redux Store:', state);

      if (state.cases) {
        extractedData.hotCases = state.cases.filter(c => c.type === 'hot');
        extractedData.historyCases = state.cases.filter(c => c.type === 'history');
      }
      if (state.rentals) {
        extractedData.rentals = state.rentals;
      }
    }
  } catch (e) {
    console.log('⚠️  無法從 Redux Store 提取:', e.message);
  }

  // 方法 2: 嘗試從 window 對象提取
  try {
    if (window.store) {
      const state = window.store.getState();
      console.log('✅ 找到 window.store:', state);

      if (state.cases) {
        extractedData.hotCases = state.cases.filter(c => c.type === 'hot');
        extractedData.historyCases = state.cases.filter(c => c.type === 'history');
      }
      if (state.rentals) {
        extractedData.rentals = state.rentals;
      }
    }
  } catch (e) {
    console.log('⚠️  無法從 window.store 提取:', e.message);
  }

  // 方法 3: 從 DOM 提取卡片資料
  try {
    console.log('🔍 嘗試從 DOM 提取...');

    // 提取所有卡片元素
    const cards = document.querySelectorAll('.card, .case-card, .item-card, [class*="card"]');
    console.log(`找到 ${cards.length} 個卡片元素`);

    cards.forEach((card, index) => {
      const title = card.querySelector('h1, h2, h3, .title, [class*="title"]')?.textContent?.trim();
      const subtitle = card.querySelector('.subtitle, [class*="subtitle"], p')?.textContent?.trim();
      const link = card.querySelector('a')?.getAttribute('href');
      const img = card.querySelector('img')?.getAttribute('src');

      if (title || link) {
        console.log(`卡片 ${index + 1}:`, { title, subtitle, link, img });
      }
    });
  } catch (e) {
    console.log('⚠️  無法從 DOM 提取:', e.message);
  }

  // 方法 4: 從 localStorage 或 sessionStorage 提取
  try {
    const localData = Object.keys(localStorage).reduce((acc, key) => {
      try {
        acc[key] = JSON.parse(localStorage.getItem(key));
      } catch {
        acc[key] = localStorage.getItem(key);
      }
      return acc;
    }, {});

    console.log('📦 localStorage 內容:', localData);

    if (localData.cases) extractedData.hotCases = localData.cases.filter(c => c.type === 'hot');
    if (localData.rentals) extractedData.rentals = localData.rentals;
  } catch (e) {
    console.log('⚠️  無法從 localStorage 提取:', e.message);
  }

  // 方法 5: 檢查網路請求
  console.log('📡 請打開 Network 標籤，刷新頁面，查找以下請求：');
  console.log('  - Google Sheets API 請求');
  console.log('  - JSON 資料檔案');
  console.log('  - CloudFront CDN 請求');

  // 輸出結果
  console.log('\n📊 提取結果:');
  console.log(`  熱銷個案: ${extractedData.hotCases.length} 筆`);
  console.log(`  歷年個案: ${extractedData.historyCases.length} 筆`);
  console.log(`  租售物件: ${extractedData.rentals.length} 筆`);

  if (extractedData.hotCases.length > 0 || extractedData.historyCases.length > 0 || extractedData.rentals.length > 0) {
    console.log('\n✅ 資料提取成功！執行以下命令下載：');
    console.log('copy(extractedData)');

    // 自動下載 JSON
    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jianlin-data-' + new Date().toISOString().split('T')[0] + '.json';
    link.click();

    console.log('📥 資料已下載！');
  } else {
    console.log('\n⚠️  未能自動提取資料');
    console.log('\n📝 手動提取步驟：');
    console.log('1. 打開 Network 標籤');
    console.log('2. 刷新頁面 (F5)');
    console.log('3. 篩選 XHR/Fetch 請求');
    console.log('4. 找到包含個案資料的 JSON 請求');
    console.log('5. 複製 Response 內容');
    console.log('\n或者使用 React DevTools 查看 Component State');
  }

  // 將資料存到全域變數供手動操作
  window.extractedData = extractedData;

  return extractedData;
})();
