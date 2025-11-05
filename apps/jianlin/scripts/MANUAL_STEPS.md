# 手動提取舊網站資料 - 詳細步驟

## 方法 1: Network 標籤查看資料請求 ✅ 最簡單

### 步驟

1. **打開舊網站**
   - 訪問: https://www.jianlin.com.tw
   - 按 `F12` 打開開發者工具

2. **切換到 Network 標籤**
   - 點擊頂部的 "Network" 標籤
   - 點擊 "XHR" 過濾按鈕（只顯示 AJAX 請求）

3. **刷新頁面**
   - 按 `F5` 或點擊刷新按鈕
   - 觀察 Network 標籤出現的請求

4. **找到資料請求**

   查找以下類型的請求：
   - Google Sheets 相關 URL
   - CloudFront CDN 的 JSON 檔案
   - 包含 "data", "cases", "rentals" 等關鍵字的請求

5. **查看 Response**
   - 點擊請求
   - 切換到 "Response" 或 "Preview" 標籤
   - 如果看到 JSON 資料，右鍵點擊 → "Copy response"

6. **導覽到不同頁面重複此步驟**
   - 點擊「熱銷個案」→ 觀察 Network 請求
   - 點擊「歷年個案」→ 觀察 Network 請求
   - 點擊「租售物件」→ 觀察 Network 請求

---

## 方法 2: React DevTools 查看 State

### 前置準備

安裝 React DevTools 擴充套件：
- Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi

### 步驟

1. **打開 React DevTools**
   - 按 `F12` → 切換到 "Components" 標籤

2. **找到包含資料的 Component**
   - 在左側 Component 樹中搜尋 "App", "Home", "Cases" 等
   - 點擊 Component
   - 在右側查看 "props" 和 "state"

3. **複製資料**
   - 右鍵點擊 state 值 → "Store as global variable"
   - 在 Console 輸入 `copy(temp1)` 複製到剪貼簿
   - 貼到文字編輯器中

---

## 方法 3: Console 手動查詢

### 如果網站將資料存在全域變數

1. **在 Console 輸入以下命令逐一嘗試**：

```javascript
// 嘗試 1: 檢查 window 對象
console.dir(window);

// 嘗試 2: Redux Store
window.store?.getState()

// 嘗試 3: React 內部狀態
document.querySelector('#root')._reactRootContainer?._internalRoot?.current

// 嘗試 4: 查找所有包含 "case" 的變數
Object.keys(window).filter(k => k.toLowerCase().includes('case'))

// 嘗試 5: localStorage
JSON.parse(localStorage.getItem('cases'))
```

2. **如果找到資料**：
```javascript
// 複製到剪貼簿
copy(資料變數名稱)
```

---

## 方法 4: 直接查看頁面顯示的內容

### 如果資料量不多，可以手動記錄

1. **瀏覽每個頁面**
   - 熱銷個案列表頁
   - 歷年個案列表頁
   - 租售物件列表頁

2. **記錄以下資訊**：
   - 標題
   - 副標題
   - 圖片 URL（右鍵點擊圖片 → 複製圖片地址）
   - 內容描述

3. **點擊進入詳情頁**
   - 記錄完整內容
   - 記錄所有圖片
   - 記錄 URL 中的 ID

4. **整理成 JSON 格式**

   使用 `/scripts/data-template.json` 作為範本

---

## 方法 5: 使用 Puppeteer 自動化（需要技術能力）

### 如果你熟悉 Node.js

```bash
# 安裝依賴
cd /Users/hanfourhuang/Projects/jianlin-nextjs
npm install --save-dev puppeteer

# 修改 scrape-with-puppeteer.js 中的選擇器
# 然後執行
node scripts/scrape-with-puppeteer.js
```

---

## 預期資料格式

提取後的資料應該符合以下格式：

```json
{
  "hotCases": [
    {
      "numberID": "hot001",
      "title": "新竹之昇",
      "subtitle": "一座跨越世紀的新竹公園",
      "content": "<p>詳細內容...</p>",
      "images": [
        "https://d377o53dybsd55.cloudfront.net/images/xxx.jpg",
        "https://d377o53dybsd55.cloudfront.net/images/yyy.jpg"
      ],
      "type": "hot"
    }
  ],
  "historyCases": [...],
  "rentals": [...]
}
```

---

## 常見問題

### Q: 看不到任何 Network 請求怎麼辦？

A: 網站可能使用 Service Worker 或其他緩存機制。嘗試：
1. 在 Network 標籤勾選 "Disable cache"
2. 右鍵點擊刷新按鈕 → 選擇 "清空快取並強制重新整理"

### Q: Response 顯示 403 或 401 錯誤？

A: 資料可能需要認證。嘗試：
1. 確認已登入（如果有後台）
2. 檢查 Request Headers 中是否有 Authorization token
3. 可能需要直接從 Google Sheets 手動匯出

### Q: 找不到任何 JSON 請求？

A: 資料可能內嵌在 HTML 或 JavaScript 中。嘗試：
1. 查看 `<script>` 標籤中是否有 JSON 資料
2. 搜尋 HTML 原始碼中的個案標題
3. 使用 React DevTools 查看 Component State

### Q: 圖片 URL 都是 CloudFront，如何下載？

A:
1. 右鍵點擊網頁上顯示的圖片 → "另存圖片"
2. 或使用瀏覽器插件批次下載圖片
3. 儲存到 `public/images/` 目錄
4. 修改 JSON 中的路徑為 `images/檔名.jpg`

---

## 完成後

將提取的資料儲存為 JSON 檔案，放到以下位置：

```
/Users/hanfourhuang/Projects/jianlin-nextjs/lib/data/extracted-data.json
```

然後告訴我，我會協助匯入到正式的資料庫中。

---

## 需要幫助？

如果遇到任何問題：
1. 截圖 Network 標籤的內容
2. 截圖 Console 的錯誤訊息
3. 告訴我你看到了什麼

我會協助你找到正確的資料來源！
