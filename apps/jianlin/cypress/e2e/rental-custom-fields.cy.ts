/// <reference types="cypress" />

/**
 * E2E 測試：不動產自訂欄位完整流程
 *
 * 測試範圍：
 * 1. 管理後台建立帶有自訂欄位的不動產
 * 2. 驗證前台正確顯示自訂欄位
 * 3. 驗證 Grid 佈局邏輯（配對/單獨）
 */
describe('Rental Custom Fields - E2E', () => {
  const testRentalId = 'test_rental_' + Date.now();

  beforeEach(() => {
    // 使用 cy.session 保持登入狀態
    cy.session('admin', () => {
      cy.visit('/login');
      cy.get('input[name="account"]').type('admin');
      cy.get('input[name="password"]').type('admin');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/admin');
    });
  });

  it('should create rental with custom fields and display correctly on frontend', () => {
    // 1. 前往新增不動產頁面
    cy.visit('/admin/real_estate/new');
    cy.url().should('include', '/admin/real_estate/new');

    // 2. 填寫基本資訊
    cy.get('input#numberID').clear().type(testRentalId);
    cy.get('input#name').type('測試物件 - 自訂欄位');
    cy.get('input#price').type('1000000');
    cy.get('input#floor').type('50');

    // 3. 新增自訂欄位：車位類型 (textarea)
    cy.contains('button', '新增欄位').click();
    cy.get('[data-testid^="custom-field-"]').last().within(() => {
      cy.get('input[placeholder="欄位標題"]').type('車位類型');
      cy.get('select').select('textarea');
      cy.get('textarea').type('平面車位\n機械車位');
    });

    // 4. 新增自訂欄位：車位數量 (input)
    cy.contains('button', '新增欄位').click();
    cy.get('[data-testid^="custom-field-"]').last().within(() => {
      cy.get('input[placeholder="欄位標題"]').type('車位數量');
      cy.get('select').select('input');
      cy.get('input[placeholder="欄位內容"]').type('2');
    });

    // 5. 新增自訂欄位：停車規範 (richtext)
    cy.contains('button', '新增欄位').click();
    cy.get('[data-testid^="custom-field-"]').last().within(() => {
      cy.get('input[placeholder="欄位標題"]').type('停車規範');
      cy.get('select').select('richtext');
    });
    // TipTap 編輯器需要特殊處理
    cy.get('.tiptap').last().type('僅供住戶使用，禁止對外出租');

    // 6. 新增配對測試：額外費用 + 管理費 (兩個 input 應該並排)
    cy.contains('button', '新增欄位').click();
    cy.get('[data-testid^="custom-field-"]').last().within(() => {
      cy.get('input[placeholder="欄位標題"]').type('額外費用');
      cy.get('select').select('input');
      cy.get('input[placeholder="欄位內容"]').type('1000元/月');
    });

    cy.contains('button', '新增欄位').click();
    cy.get('[data-testid^="custom-field-"]').last().within(() => {
      cy.get('input[placeholder="欄位標題"]').type('管理費');
      cy.get('select').select('input');
      cy.get('input[placeholder="欄位內容"]').type('2000元/月');
    });

    // 7. 提交表單
    cy.contains('button', '建立不動產').click();

    // 8. 等待跳轉到列表頁
    cy.url().should('include', '/admin/real_estate_list', { timeout: 10000 });

    // 9. 前往前台查看
    cy.visit(`/real_estate/${testRentalId}`);

    // 10. 驗證基本資訊
    cy.contains('測試物件 - 自訂欄位').should('be.visible');
    cy.contains('價格：').parent().should('contain', '1000000');
    cy.contains('坪數：').parent().should('contain', '50');

    // 11. 驗證自訂欄位渲染
    cy.get('.bg-gray-50').within(() => {
      // 車位類型 (textarea) - 應該獨占一行
      cy.contains('車位類型：').should('be.visible');
      cy.contains('平面車位').should('be.visible');
      cy.contains('機械車位').should('be.visible');

      // 車位數量 (input) - 應該在 grid 容器內
      cy.contains('車位數量：').parent().should('have.class', 'flex');
      cy.contains('車位數量：').closest('div.grid').should('exist');

      // 停車規範 (richtext) - 應該獨占一行
      cy.contains('停車規範：').should('be.visible');
      cy.contains('僅供住戶使用').should('be.visible');

      // 額外費用 + 管理費 (兩個 input) - 應該並排在同一個 grid 內
      cy.contains('額外費用：').closest('div.grid').within(() => {
        cy.contains('額外費用：').should('be.visible');
        cy.contains('管理費：').should('be.visible');
      });
    });

    // 12. 驗證 Grid 佈局結構
    cy.get('.bg-gray-50').within(() => {
      // 檢查車位數量是在 grid 容器內（即使只有一個欄位）
      cy.contains('車位數量：')
        .closest('div.grid')
        .should('have.class', 'md:grid-cols-2');

      // 檢查額外費用和管理費在同一個 grid 內
      cy.contains('額外費用：')
        .parent()
        .parent()
        .should('have.class', 'grid')
        .within(() => {
          cy.get('.flex').should('have.length', 2);
        });
    });
  });

  after(() => {
    // 清理測試資料
    cy.request({
      method: 'DELETE',
      url: `/api/admin/rentals/${testRentalId}`,
      failOnStatusCode: false,
    });
  });
});
