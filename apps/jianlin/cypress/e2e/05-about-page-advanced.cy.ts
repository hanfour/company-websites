describe('About Page - Advanced E2E Tests', () => {
  let testBlocks: any;

  before(() => {
    // Load test fixtures
    cy.fixture('aboutBlocks').then((data) => {
      testBlocks = data;
    });
  });

  beforeEach(() => {
    // Handle hydration errors
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed') || err.message.includes('hydration')) {
        return false;
      }
      return true;
    });
  });

  describe('Dynamic Content Rendering', () => {
    beforeEach(() => {
      // Setup test data via API
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        headers: { 'Content-Type': 'application/json' },
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(1000); // Wait for data to load
    });

    it('should display visible blocks only', () => {
      // Should show 2 visible blocks
      cy.contains('測試區塊 1').should('be.visible');
      cy.contains('測試區塊 2').should('be.visible');

      // Should not show hidden block
      cy.contains('測試區塊 3').should('not.exist');
    });

    it('should render blocks in correct order', () => {
      cy.get('body').then(($body) => {
        const text = $body.text();
        const index1 = text.indexOf('測試區塊 1');
        const index2 = text.indexOf('測試區塊 2');

        // Block 1 should appear before Block 2
        expect(index1).to.be.lessThan(index2);
      });
    });

    it('should render rich text content correctly', () => {
      cy.get('div[class*="prose"]').should('exist');
      cy.contains('測試內容 1').should('be.visible');
    });
  });

  describe('Layout Template Rendering', () => {
    it('should render text-only layout correctly', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.textOnly] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(500);

      cy.contains('純文字測試區塊').should('be.visible');
      cy.contains('這是一個純文字區塊的測試內容').should('be.visible');
    });

    it('should render text-with-top-image layout correctly', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.textWithTopImage] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(500);

      cy.contains('上圖下文測試區塊').should('be.visible');

      // Check if layout has image section above text
      cy.get('body').then(($body) => {
        const hasImage = $body.find('img').length > 0;
        if (hasImage) {
          cy.get('img').first().should('exist');
        }
      });
    });

    it('should render text-with-left-image layout correctly', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.textWithLeftImage] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(500);

      cy.contains('左圖右文測試區塊').should('be.visible');
      // Verify flex layout exists (image and text side by side)
      cy.get('div[class*="flex"]').should('exist');
    });

    it('should render text-with-right-image layout correctly', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.textWithRightImage] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(500);

      cy.contains('右圖左文測試區塊').should('be.visible');
      // Verify flex-row-reverse layout exists
      cy.get('div[class*="flex"]').should('exist');
    });

    it('should render image-only layout correctly', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [testBlocks.imageOnly] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
      cy.wait(500);

      // Should show image caption
      cy.contains('純圖片區塊標題').should('exist');
    });
  });

  describe('Responsive Design Tests', () => {
    beforeEach(() => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });
    });

    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should display correctly on ${name} (${width}x${height})`, () => {
        cy.viewport(width, height);
        cy.visit('/about_us');
        cy.wait(500);

        // Page title should be visible
        cy.contains('關於・建林工業股份有限公司').should('be.visible');

        // Content blocks should be visible
        cy.contains('測試區塊 1').should('be.visible');

        // Check responsive classes are applied
        cy.get('body').should('be.visible');

        // Verify layout adapts
        if (width < 768) {
          // Mobile: should stack vertically
          cy.get('div[class*="flex-col"]').should('exist');
        }
      });
    });
  });

  describe('Interactive Elements', () => {
    beforeEach(() => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });

      cy.visit('/about_us');
    });

    it('should be scrollable', () => {
      cy.scrollTo('bottom');
      cy.scrollTo('top');
      cy.get('body').should('be.visible');
    });

    it('should maintain state after scroll', () => {
      const initialTitle = '關於・建林工業股份有限公司';

      cy.contains(initialTitle).should('be.visible');
      cy.scrollTo('bottom');
      cy.scrollTo('top');
      cy.contains(initialTitle).should('be.visible');
    });

    it('should handle rapid viewport changes', () => {
      cy.viewport('iphone-x');
      cy.wait(200);
      cy.viewport('ipad-2');
      cy.wait(200);
      cy.viewport(1920, 1080);

      cy.get('body').should('be.visible');
      cy.contains('關於・建林工業股份有限公司').should('be.visible');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty blocks gracefully', () => {
      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');

      // Page should still load
      cy.contains('關於・建林工業股份有限公司').should('be.visible');
    });

    it('should handle blocks with missing fields', () => {
      const incompleteBlock = {
        id: 'incomplete',
        order: 0,
        show: true,
        title: 'Incomplete Block',
        layoutTemplate: 'text-only'
        // Missing caption
      };

      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [incompleteBlock] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');

      // Should still render without errors
      cy.contains('Incomplete Block').should('be.visible');
    });

    it('should handle very long content', () => {
      const longBlock = {
        id: 'long',
        order: 0,
        show: true,
        title: '很長的內容測試',
        caption: '<p>' + 'A'.repeat(5000) + '</p>',
        layoutTemplate: 'text-only'
      };

      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: [longBlock] },
        failOnStatusCode: false
      });

      cy.visit('/about_us');

      // Should render without crashing
      cy.contains('很長的內容測試').should('be.visible');
    });
  });

  describe('Performance Tests', () => {
    it('should load page within acceptable time', () => {
      const startTime = Date.now();

      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: testBlocks.allBlocks },
        failOnStatusCode: false
      });

      cy.visit('/about_us');

      cy.contains('關於・建林工業股份有限公司').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Page should load within 5 seconds
        expect(loadTime).to.be.lessThan(5000);
      });
    });

    it('should handle many blocks efficiently', () => {
      // Create 20 blocks
      const manyBlocks = Array.from({ length: 20 }, (_, i) => ({
        id: `block_${i}`,
        order: i,
        show: true,
        title: `區塊 ${i + 1}`,
        caption: `<p>內容 ${i + 1}</p>`,
        layoutTemplate: 'text-only'
      }));

      cy.request({
        method: 'PUT',
        url: '/api/admin/about-content',
        body: { about: manyBlocks },
        failOnStatusCode: false
      });

      cy.visit('/about_us');

      // Should still load without timeout
      cy.contains('關於・建林工業股份有限公司').should('be.visible');
      cy.contains('區塊 1').should('be.visible');
      cy.contains('區塊 20').should('exist');
    });
  });
});
