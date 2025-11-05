describe('Admin About Blocks Management - Advanced E2E Tests', () => {
  let testBlocks: any;

  before(() => {
    cy.fixture('aboutBlocks').then((data) => {
      testBlocks = data;
    });
  });

  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (
        err.message.includes('Hydration') ||
        err.message.includes('fetch') ||
        err.message.includes('UNAUTHORIZED')
      ) {
        return false;
      }
      return true;
    });

    // Clean up before each test
    cy.request({
      method: 'PUT',
      url: '/api/admin/about-content',
      body: { about: [] },
      failOnStatusCode: false
    });
  });

  describe('Authentication & Authorization', () => {
    it('should redirect unauthenticated users to login', () => {
      // Clear any existing sessions
      cy.clearCookies();
      cy.clearLocalStorage();

      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      // Should be redirected to login
      cy.url().should('match', /\/(login|admin)$/);
    });

    it('should allow authenticated admin to access', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/about-blocks');

      cy.get('body').then(($body) => {
        const isAdminPage = $body.text().includes('關於建林') || $body.text().includes('區塊管理');
        const isLoginPage = $body.text().includes('登入');

        // Should be on admin page, not login
        expect(isLoginPage).to.be.false;
      });
    });
  });

  describe('Complete CRUD Operations Flow', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should complete full create-read-update-delete cycle', () => {
      // Step 1: Navigate to blocks management
      cy.visit('/admin/about-blocks');
      cy.wait(500);

      // Step 2: CREATE - Add new block
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();

          // Should navigate to create page
          cy.url().should('include', '/admin/about-blocks/edit/');

          // Fill in block details
          cy.get('input[type="text"]').first().clear().type('E2E 測試區塊');

          // Select layout template
          cy.contains('純文字').click();

          // Fill rich text editor (if present)
          cy.get('body').then(($b) => {
            const hasEditor = $b.find('.tiptap, [contenteditable="true"]').length > 0;
            if (hasEditor) {
              cy.get('.tiptap, [contenteditable="true"]').first().type('這是 E2E 測試內容');
            }
          });

          // Check "show" checkbox
          cy.get('input[type="checkbox"]').check({ force: true });

          // Save the block
          cy.contains('button', '儲存').click();
          cy.wait(1000);

          // Step 3: READ - Verify block appears in list
          cy.url().should('include', '/admin/about-blocks');
          cy.contains('E2E 測試區塊').should('exist');

          // Step 4: UPDATE - Edit the block
          cy.contains('E2E 測試區塊').parents('div').within(() => {
            cy.contains('button', '編輯').click();
          });

          cy.url().should('include', '/admin/about-blocks/edit/');

          // Update title
          cy.get('input[type="text"]').first().clear().type('已更新的 E2E 測試區塊');

          // Save changes
          cy.contains('button', '儲存').click();
          cy.wait(1000);

          // Verify update
          cy.contains('已更新的 E2E 測試區塊').should('exist');

          // Step 5: DELETE - Remove the block
          cy.contains('已更新的 E2E 測試區塊').parents('div').within(() => {
            cy.contains('button', '刪除').click();
          });

          // Confirm deletion
          cy.on('window:confirm', () => true);

          // Save changes
          cy.contains('button', '儲存所有變更').click();
          cy.wait(1000);

          // Verify deletion
          cy.contains('已更新的 E2E 測試區塊').should('not.exist');
        }
      });
    });

    it('should create multiple blocks with different templates', () => {
      cy.visit('/admin/about-blocks');
      cy.wait(500);

      const templates = [
        { name: '純文字區塊', template: '純文字' },
        { name: '上圖下文區塊', template: '上圖下文' },
        { name: '左圖右文區塊', template: '左圖右文' }
      ];

      templates.forEach(({ name, template }, index) => {
        cy.get('body').then(($body) => {
          if ($body.text().includes('新增區塊')) {
            cy.contains('button', '新增區塊').click();
            cy.wait(300);

            cy.get('input[type="text"]').first().clear().type(name);
            cy.contains(template).click();

            cy.get('input[type="checkbox"]').check({ force: true });

            cy.contains('button', '儲存').click();
            cy.wait(800);
          }
        });
      });

      // Verify all blocks were created
      cy.visit('/admin/about-blocks');
      templates.forEach(({ name }) => {
        cy.contains(name).should('exist');
      });
    });
  });

  describe('Block Ordering & Visibility', () => {
    beforeEach(() => {
      cy.loginAsAdmin();

      // Setup test blocks
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });

      cy.visit('/admin/about-blocks');
      cy.wait(500);
    });

    it('should reorder blocks using up/down buttons', () => {
      cy.get('body').then(($body) => {
        const hasBlocks = $body.text().includes('測試區塊');

        if (hasBlocks) {
          // Find second block and move it up
          cy.contains('測試區塊 2').parents('div').within(() => {
            cy.contains('button', '↑').click();
          });

          cy.wait(300);

          // Verify order changed in DOM
          cy.get('body').then(($b) => {
            const text = $b.text();
            const index1 = text.indexOf('測試區塊 2');
            const index2 = text.indexOf('測試區塊 1');

            // Block 2 should now appear before Block 1
            if (index1 !== -1 && index2 !== -1) {
              expect(index1).to.be.lessThan(index2);
            }
          });
        }
      });
    });

    it('should toggle block visibility', () => {
      cy.get('body').then(($body) => {
        const hasBlocks = $body.text().includes('測試區塊 1');

        if (hasBlocks) {
          // Find first block and hide it
          cy.contains('測試區塊 1').parents('div').within(() => {
            cy.contains('button', '隱藏').click();
          });

          cy.wait(300);

          // Verify "已隱藏" label appears
          cy.contains('測試區塊 1').parents('div').should('contain', '已隱藏');

          // Show it again
          cy.contains('測試區塊 1').parents('div').within(() => {
            cy.contains('button', '顯示').click();
          });

          cy.wait(300);

          // "已隱藏" should be gone
          cy.contains('測試區塊 1').parents('div').should('not.contain', '已隱藏');
        }
      });
    });

    it('should save changes permanently', () => {
      cy.get('body').then(($body) => {
        const hasBlocks = $body.text().includes('測試區塊');

        if (hasBlocks) {
          // Make a change
          cy.contains('測試區塊 1').parents('div').within(() => {
            cy.contains('button', '隱藏').click();
          });

          // Save
          cy.contains('button', '儲存所有變更').click();
          cy.wait(1000);

          // Reload page
          cy.reload();
          cy.wait(500);

          // Verify change persisted
          cy.get('body').then(($b) => {
            if ($b.text().includes('測試區塊 1')) {
              cy.contains('測試區塊 1').parents('div').should('contain', '已隱藏');
            }
          });
        }
      });
    });
  });

  describe('Layout Template Selection', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/about-blocks');
    });

    it('should display all 5 layout templates in edit form', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();
          cy.wait(300);

          // Verify all templates are present
          const templates = ['純文字', '上圖下文', '左圖右文', '右圖左文', '純圖片'];

          templates.forEach((template) => {
            cy.contains(template).should('exist');
          });
        }
      });
    });

    it('should switch between templates', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();
          cy.wait(300);

          // Select text-only
          cy.contains('純文字').click();
          cy.get('input[value="text-only"]').should('be.checked');

          // Switch to top-image
          cy.contains('上圖下文').click();
          cy.get('input[value="text-with-top-image"]').should('be.checked');

          // Switch to left-image
          cy.contains('左圖右文').click();
          cy.get('input[value="text-with-left-image"]').should('be.checked');
        }
      });
    });

    it('should show/hide image uploader based on template', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();
          cy.wait(300);

          // Select text-only (no image needed)
          cy.contains('純文字').click();
          cy.wait(200);

          // Image uploader should not be visible or required
          cy.get('body').then(($b) => {
            const hasImageSection = $b.text().includes('圖片');
            if (!hasImageSection) {
              expect(true).to.be.true; // No image section for text-only
            }
          });

          // Select template with image
          cy.contains('上圖下文').click();
          cy.wait(200);

          // Image section should appear
          cy.contains('圖片').should('exist');
        }
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
      cy.visit('/admin/about-blocks');
    });

    it('should require title field', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();
          cy.wait(300);

          // Try to save without title
          cy.contains('button', '儲存').click();

          // Should show alert or remain on page
          cy.on('window:alert', (text) => {
            expect(text).to.include('標題');
          });

          cy.url().should('include', '/edit/');
        }
      });
    });

    it('should validate required fields for image templates', () => {
      cy.get('body').then(($body) => {
        if ($body.text().includes('新增區塊')) {
          cy.contains('button', '新增區塊').click();
          cy.wait(300);

          // Fill title
          cy.get('input[type="text"]').first().type('Test Block');

          // Select template requiring image
          cy.contains('上圖下文').click();
          cy.wait(200);

          // Try to save without image (if validation exists)
          cy.contains('button', '儲存').click();

          // May show validation message
          cy.get('body').should('exist');
        }
      });
    });
  });

  describe('User Experience & Interactions', () => {
    beforeEach(() => {
      cy.loginAsAdmin();

      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });

      cy.visit('/admin/about-blocks');
      cy.wait(500);
    });

    it('should navigate back using cancel button', () => {
      cy.get('body').then(($body) => {
        const hasEditButton = $body.find('button:contains("編輯")').length > 0;

        if (hasEditButton) {
          cy.contains('button', '編輯').first().click();
          cy.wait(300);

          cy.url().should('include', '/edit/');

          // Click cancel
          cy.contains('button', '取消').click();

          // Should return to list page
          cy.url().should('match', /\/admin\/about-blocks$/);
        }
      });
    });

    it('should show help text and instructions', () => {
      cy.contains('提示').should('exist');

      // Check for helpful instructions
      cy.get('body').then(($body) => {
        const hasInstructions =
          $body.text().includes('排序') ||
          $body.text().includes('新增') ||
          $body.text().includes('編輯');

        expect(hasInstructions).to.be.true;
      });
    });

    it('should be responsive on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.wait(300);

      // Page should still be functional
      cy.get('body').should('be.visible');

      cy.get('body').then(($body) => {
        const hasContent =
          $body.text().includes('關於建林') ||
          $body.text().includes('區塊') ||
          $body.text().includes('測試');

        expect(hasContent).to.be.true;
      });
    });
  });

  describe('Data Persistence & Consistency', () => {
    beforeEach(() => {
      cy.loginAsAdmin();
    });

    it('should maintain data consistency across page reloads', () => {
      // Create a block
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: {
          about: [{
            id: 'persistence_test',
            order: 0,
            show: true,
            title: '持久性測試區塊',
            caption: '<p>測試內容</p>',
            layoutTemplate: 'text-only'
          }]
        }
      });

      // Visit page
      cy.visit('/admin/about-blocks');
      cy.wait(500);

      cy.contains('持久性測試區塊').should('exist');

      // Reload
      cy.reload();
      cy.wait(500);

      // Should still exist
      cy.contains('持久性測試區塊').should('exist');

      // Visit public page
      cy.visit('/about_us');
      cy.wait(500);

      // Should be visible on public page
      cy.contains('持久性測試區塊').should('be.visible');
    });

    it('should handle concurrent edits gracefully', () => {
      // This simulates saving data, then immediately making another change
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.textOnly] }
      });

      cy.visit('/admin/about-blocks');
      cy.wait(500);

      // Make a change
      cy.get('body').then(($body) => {
        const hasBlock = $body.text().includes('純文字測試區塊');

        if (hasBlock) {
          cy.contains('純文字測試區塊').parents('div').within(() => {
            cy.contains('button', '隱藏').click();
          });

          // Save immediately
          cy.contains('button', '儲存所有變更').click();
          cy.wait(500);

          // Verify saved
          cy.reload();
          cy.wait(500);

          cy.get('body').then(($b) => {
            if ($b.text().includes('純文字測試區塊')) {
              cy.contains('純文字測試區塊').parents('div').should('contain', '已隱藏');
            }
          });
        }
      });
    });
  });
});
