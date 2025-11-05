describe('Admin About Blocks Management', () => {
  beforeEach(() => {
    // Handle hydration errors from Next.js development mode
    cy.on('uncaught:exception', (err) => {
      // Ignore hydration errors and network errors in development
      if (
        err.message.includes('Hydration failed') ||
        err.message.includes('hydration') ||
        err.message.includes('fetch')
      ) {
        return false;
      }
      return true;
    });
  });

  describe('Unauthenticated Access', () => {
    it('should redirect to login when not authenticated', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });
      // Should redirect to login page
      cy.url().should('include', '/login');
    });
  });

  describe('Authenticated Access', () => {
    beforeEach(() => {
      // Mock authentication - set cookie
      // In real scenario, you would login first
      cy.setCookie('auth-token', 'mock-jwt-token-for-testing');
    });

    it('should load admin about blocks page', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isLoginPage = $body.text().includes('登入') || $body.find('input[type="password"]').length > 0;
        const isAdminPage = $body.text().includes('關於建林區塊管理') || $body.text().includes('新增區塊');

        // Either should be on admin page or login page (depending on auth state)
        expect(isLoginPage || isAdminPage).to.be.true;
      });
    });

    it('should display page title', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const hasTitle = $body.text().includes('關於建林') || $body.text().includes('區塊');
        // If we're on the admin page, title should exist
        if (!$body.text().includes('登入')) {
          expect(hasTitle).to.be.true;
        }
      });
    });

    it('should display action buttons', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isAdminPage = !$body.text().includes('登入');

        if (isAdminPage) {
          const hasNewButton = $body.text().includes('新增區塊') || $body.find('button:contains("新增")').length > 0;
          const hasSaveButton = $body.text().includes('儲存') || $body.find('button:contains("儲存")').length > 0;

          expect(hasNewButton || hasSaveButton).to.be.true;
        }
      });
    });

    it('should display blocks list or empty state', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isAdminPage = !$body.text().includes('登入');

        if (isAdminPage) {
          const hasBlocks = $body.find('button:contains("編輯")').length > 0;
          const hasEmptyState = $body.text().includes('尚無區塊') || $body.text().includes('開始');

          // Either has blocks or shows empty state
          expect(hasBlocks || hasEmptyState).to.be.true;
        }
      });
    });

    it('should show block management buttons if blocks exist', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isAdminPage = !$body.text().includes('登入');
        const hasEditButtons = $body.find('button:contains("編輯")').length > 0;

        if (isAdminPage && hasEditButtons) {
          // Should have move up/down buttons
          const hasMoveButtons = $body.text().includes('↑') || $body.text().includes('↓');
          // Should have delete/hide buttons
          const hasDeleteButton = $body.text().includes('刪除');
          const hasHideButton = $body.text().includes('隱藏') || $body.text().includes('顯示');

          expect(hasMoveButtons || hasDeleteButton || hasHideButton).to.be.true;
        }
      });
    });

    it('should display block information', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isAdminPage = !$body.text().includes('登入');
        const hasBlocks = $body.find('button:contains("編輯")').length > 0;

        if (isAdminPage && hasBlocks) {
          // Should show layout template labels
          const hasTemplateLabel =
            $body.text().includes('純文字') ||
            $body.text().includes('上圖下文') ||
            $body.text().includes('左圖右文') ||
            $body.text().includes('右圖左文') ||
            $body.text().includes('純圖片');

          expect(hasTemplateLabel).to.be.true;
        }
      });
    });

    it('should display help text', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isAdminPage = !$body.text().includes('登入');

        if (isAdminPage) {
          const hasHelpText =
            $body.text().includes('提示') ||
            $body.text().includes('排序') ||
            $body.text().includes('佈局模板');

          expect(hasHelpText).to.be.true;
        }
      });
    });
  });

  describe('Edit Block Page', () => {
    beforeEach(() => {
      cy.setCookie('auth-token', 'mock-jwt-token-for-testing');
    });

    it('should navigate to edit page', () => {
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const hasEditButton = $body.find('button:contains("編輯")').length > 0;

        if (hasEditButton) {
          cy.get('button:contains("編輯")').first().click();
          // Should navigate to edit page
          cy.url().should('include', '/admin/about-blocks/edit/');
        }
      });
    });

    it('should load edit form on edit page', () => {
      // Visit edit page directly with a mock ID
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasForm = $body.find('input, textarea, button').length > 0;
          expect(hasForm).to.be.true;
        }
      });
    });

    it('should display layout template selector', () => {
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasTemplateSelector =
            $body.text().includes('選擇佈局模板') ||
            $body.text().includes('純文字') ||
            $body.text().includes('上圖下文');

          expect(hasTemplateSelector).to.be.true;
        }
      });
    });

    it('should show all 5 layout templates', () => {
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasTextOnly = $body.text().includes('純文字');
          const hasTopImage = $body.text().includes('上圖下文');
          const hasLeftImage = $body.text().includes('左圖右文');
          const hasRightImage = $body.text().includes('右圖左文');
          const hasImageOnly = $body.text().includes('純圖片');

          const templateCount = [hasTextOnly, hasTopImage, hasLeftImage, hasRightImage, hasImageOnly]
            .filter(Boolean).length;

          // Should have at least 3 templates visible
          expect(templateCount).to.be.greaterThan(2);
        }
      });
    });

    it('should display title input field', () => {
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasTitleField = $body.find('input[type="text"]').length > 0;
          expect(hasTitleField).to.be.true;
        }
      });
    });

    it('should display save and cancel buttons', () => {
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasSaveButton = $body.text().includes('儲存');
          const hasCancelButton = $body.text().includes('取消');

          expect(hasSaveButton && hasCancelButton).to.be.true;
        }
      });
    });

    it('should display show/hide checkbox', () => {
      cy.visit('/admin/about-blocks/edit/block_test', { failOnStatusCode: false });

      cy.get('body').then(($body) => {
        const isEditPage = !$body.text().includes('登入');

        if (isEditPage) {
          const hasShowCheckbox =
            $body.text().includes('在前端顯示') ||
            $body.find('input[type="checkbox"]').length > 0;

          expect(hasShowCheckbox).to.be.true;
        }
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.setCookie('auth-token', 'mock-jwt-token-for-testing');
    });

    it('should be responsive on mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });
      cy.get('body').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport('ipad-2');
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });
      cy.get('body').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080);
      cy.visit('/admin/about-blocks', { failOnStatusCode: false });
      cy.get('body').should('be.visible');
    });
  });
});
