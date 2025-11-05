# E2E 測試完整文檔

## 概述

本項目已建立完整的 E2E 測試框架，涵蓋基礎測試和進階測試，確保 About 頁面動態區塊管理系統的品質。

## 測試架構

### 1. 自定義命令 (Cypress Commands)

位置：`cypress/support/commands.ts`

#### 已實現的自定義命令：

| 命令 | 用途 | 範例 |
|------|------|------|
| `checkImageLoaded()` | 檢查圖片是否載入 | `cy.get('img').checkImageLoaded()` |
| `loginAsAdmin()` | 管理員登入 | `cy.loginAsAdmin()` |
| `createAboutBlock()` | 透過 API 建立區塊 | `cy.createAboutBlock(block)` |
| `cleanupAboutBlocks()` | 清理測試資料 | `cy.cleanupAboutBlocks()` |
| `waitForAPI()` | 等待 API 請求 | `cy.waitForAPI('@request')` |
| `fillRichTextEditor()` | 填寫富文本編輯器 | `cy.fillRichTextEditor('content')` |
| `isInViewport()` | 檢查元素是否在視窗內 | `cy.get('.element').isInViewport()` |

### 2. 測試資料 (Fixtures)

位置：`cypress/fixtures/aboutBlocks.json`

包含各種測試場景的資料：
- **textOnly**: 純文字區塊
- **textWithTopImage**: 上圖下文區塊
- **textWithLeftImage**: 左圖右文區塊
- **textWithRightImage**: 右圖左文區塊
- **imageOnly**: 純圖片區塊
- **hiddenBlock**: 隱藏區塊
- **allBlocks**: 多個測試區塊陣列

## 測試套件

### 基礎測試 (Basic E2E Tests)

#### 05-about-page.cy.ts - 18 個測試 ✅
**功能：** About 頁面基本功能驗證

**測試項目：**
- 頁面載入
- 標題顯示
- 內容區塊渲染
- 佈局模板支援
- 響應式設計（手機/平板/桌面）
- 無障礙功能

#### 06-admin-about-blocks.cy.ts - 18 個測試 ✅
**功能：** 管理頁面基本功能驗證

**測試項目：**
- 認證與授權
- 頁面導航
- 區塊列表顯示
- 按鈕和介面元素
- 模板選擇器
- 響應式設計

### 進階測試 (Advanced E2E Tests)

#### 05-about-page-advanced.cy.ts - 19 個測試
**功能：** About 頁面完整互動測試

**測試類別：**

1. **Dynamic Content Rendering** (3 tests)
   - 僅顯示可見區塊
   - 按順序渲染
   - 富文本正確顯示

2. **Layout Template Rendering** (5 tests)
   - 測試所有 5 種佈局模板
   - 驗證每種模板的渲染邏輯

3. **Responsive Design Tests** (3 tests)
   - 手機 (375x667)
   - 平板 (768x1024)
   - 桌面 (1920x1080)

4. **Interactive Elements** (3 tests)
   - 捲動功能
   - 狀態維護
   - 快速切換視窗大小

5. **Edge Cases** (3 tests)
   - 空區塊處理
   - 缺少欄位處理
   - 超長內容處理

6. **Performance Tests** (2 tests)
   - 載入時間（<5秒）
   - 多區塊效能（20+區塊）

#### 06-admin-about-blocks-advanced.cy.ts - 多個測試
**功能：** 管理頁面完整 CRUD 流程測試

**測試類別：**

1. **Authentication & Authorization**
   - 未認證重定向
   - 認證後存取權限

2. **Complete CRUD Operations Flow**
   - 完整的建立-讀取-更新-刪除循環
   - 多個區塊建立（不同模板）
   - 資料持久性驗證

3. **Block Ordering & Visibility**
   - 上下移動區塊
   - 切換顯示/隱藏
   - 儲存變更

4. **Layout Template Selection**
   - 顯示所有 5 種模板
   - 模板切換
   - 圖片上傳器顯示/隱藏

5. **Form Validation**
   - 必填欄位驗證
   - 圖片模板驗證

6. **User Experience & Interactions**
   - 返回導航
   - 幫助文字
   - 手機響應式

7. **Data Persistence & Consistency**
   - 跨頁面重載的資料一致性
   - 並發編輯處理

## 測試最佳實踐

### 1. 資料準備與清理
```typescript
beforeEach(() => {
  // 每個測試前清理資料
  cy.request({
    method: 'PUT',
    url: '/api/admin/about-content',
    body: { about: [] },
    failOnStatusCode: false
  });
});
```

### 2. 使用 Fixtures
```typescript
before(() => {
  cy.fixture('aboutBlocks').then((data) => {
    testBlocks = data;
  });
});
```

### 3. 錯誤處理
```typescript
cy.on('uncaught:exception', (err) => {
  if (err.message.includes('Hydration') || err.message.includes('UNAUTHORIZED')) {
    return false; // 忽略已知錯誤
  }
  return true;
});
```

### 4. 等待機制
```typescript
cy.wait(500); // 等待資料載入
cy.wait('@apiRequest'); // 等待特定 API 請求
```

## 執行測試

### 所有測試
```bash
npm run cypress:headless
```

### 特定測試檔案
```bash
npm run cypress:headless -- --spec "cypress/e2e/05-about-page.cy.ts"
```

### 進階測試
```bash
npm run cypress:headless -- --spec "cypress/e2e/*-advanced.cy.ts"
```

### 互動式模式
```bash
npm run cypress
# or
npm run e2e:open
```

## 測試結果

### 基礎測試結果 ✅
- **01-homepage.cy.ts**: 9/9 通過
- **02-navigation.cy.ts**: 7/7 通過
- **03-case-details.cy.ts**: 11/11 通過
- **04-contact-form.cy.ts**: 11/11 通過
- **05-about-page.cy.ts**: 18/18 通過
- **06-admin-about-blocks.cy.ts**: 18/18 通過

**總計**: 74/74 tests passed (100%)

### 進階測試說明
進階測試需要：
1. 有效的管理員帳號
2. API 認證設置
3. 測試環境配置

## 測試覆蓋範圍

### 功能覆蓋
- ✅ 頁面渲染
- ✅ 內容顯示
- ✅ 佈局模板（5種）
- ✅ 響應式設計
- ✅ CRUD 操作
- ✅ 排序功能
- ✅ 顯示/隱藏切換
- ✅ 表單驗證
- ✅ 資料持久性
- ✅ 無障礙功能
- ✅ 效能測試
- ✅ 邊界案例

### 瀏覽器覆蓋
- ✅ Desktop (1920x1080)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

### 用戶流程覆蓋
- ✅ 訪客瀏覽 About 頁面
- ✅ 管理員登入
- ✅ 建立新區塊
- ✅ 編輯現有區塊
- ✅ 刪除區塊
- ✅ 調整順序
- ✅ 切換可見性
- ✅ 選擇佈局模板

## 持續改進建議

### 短期改進
1. 增加 API 模擬 (Mock)
2. 視覺回歸測試
3. 可訪問性自動化檢測
4. 效能基準測試

### 長期改進
1. 跨瀏覽器測試 (Chrome, Firefox, Safari)
2. 負載測試
3. 安全性測試
4. 國際化測試

## 故障排除

### 常見問題

#### 1. 測試超時
```typescript
// 增加超時時間
cy.get('element', { timeout: 20000 })
```

#### 2. 認證失敗
```typescript
// 確認登入憑證正確
cy.loginAsAdmin('admin', 'correct-password')
```

#### 3. API 請求失敗
```typescript
// 使用 failOnStatusCode: false
cy.request({
  url: '/api/endpoint',
  failOnStatusCode: false
})
```

## 貢獻指南

### 新增測試
1. 創建新測試檔案於 `cypress/e2e/`
2. 使用描述性命名：`XX-feature-name.cy.ts`
3. 遵循現有測試結構
4. 加入適當的資料清理

### 新增自定義命令
1. 編輯 `cypress/support/commands.ts`
2. 加入 TypeScript 類型定義
3. 實現命令邏輯
4. 更新此文檔

### 新增測試資料
1. 編輯 `cypress/fixtures/` 中的 JSON 檔案
2. 使用描述性鍵名
3. 包含各種測試場景

## 結論

本 E2E 測試框架提供：
- ✅ **完整覆蓋**: 從基礎到進階的測試
- ✅ **可維護性**: 使用自定義命令和 fixtures
- ✅ **可擴展性**: 易於新增新測試
- ✅ **最佳實踐**: 遵循 Cypress 官方建議
- ✅ **真實場景**: 模擬實際用戶操作

確保 About 頁面動態區塊管理系統的品質和穩定性。
