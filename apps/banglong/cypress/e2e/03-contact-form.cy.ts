describe('Contact Form', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed') || err.message.includes('hydration')) {
        return false;
      }
      return true;
    });
    cy.visit('/contact');
  });

  it('should load contact page', () => {
    cy.url().should('include', '/contact');
    cy.get('body').should('be.visible');
  });

  it('should display contact information', () => {
    // Check for contact details
    cy.get('body').then(($body) => {
      const hasContactInfo =
        $body.text().includes('電話') ||
        $body.text().includes('地址') ||
        $body.text().includes('聯絡') ||
        $body.text().includes('Email') ||
        $body.text().includes('信箱');
      expect(hasContactInfo).to.be.true;
    });
  });

  it('should have a contact form', () => {
    // Check if form exists
    cy.get('form').should('exist');
  });

  it('should have form fields', () => {
    // Check for input fields
    cy.get('input, textarea').should('have.length.greaterThan', 0);
  });

  it('should have required form fields', () => {
    cy.get('form').within(() => {
      // Check for common form fields
      cy.get('input, textarea').should('have.length.greaterThan', 2);
    });
  });

  it('should validate empty form submission', () => {
    // Try to submit empty form
    cy.get('form').within(() => {
      cy.get('button[type="submit"]').then(($button) => {
        if ($button.length > 0) {
          cy.wrap($button).click();
        }
      });
    });

    // Form should still be on the same page or show validation errors
    cy.url().should('include', '/contact');
  });

  it('should fill contact form fields', () => {
    // Wait for form to be fully loaded
    cy.get('form').should('be.visible');

    cy.get('form').within(() => {
      // Fill name field
      cy.get('input[name="name"]').should('exist').type('測試用戶');

      // Fill email field
      cy.get('input[name="email"]').should('exist').type('test@example.com');

      // Fill phone field
      cy.get('input[name="phone"]').should('exist').type('0912345678');

      // Fill message field
      cy.get('textarea[name="message"]').should('exist').type('這是一個 E2E 測試訊息，請忽略。');
    });

    // Verify fields are filled
    cy.get('input[name="name"]').should('have.value', '測試用戶');
    cy.get('input[name="email"]').should('have.value', 'test@example.com');
    cy.get('input[name="phone"]').should('have.value', '0912345678');
    cy.get('textarea[name="message"]').should('have.value', '這是一個 E2E 測試訊息，請忽略。');

    // Note: We don't actually submit to avoid sending test data
  });

  it('should have captcha verification', () => {
    // Check for captcha or verification mechanism
    cy.get('form').within(() => {
      // Banglong uses captcha verification instead of honeypot
      const hasCaptcha =
        cy.get('input[name="verifyCode"]').should('exist') ||
        cy.get('canvas').should('exist');

      // At minimum, form should have verification
      cy.get('input, textarea, button').should('have.length.greaterThan', 3);
    });
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
    cy.get('form').should('be.visible');
  });

  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2');
    cy.get('body').should('be.visible');
    cy.get('form').should('be.visible');
  });
});
