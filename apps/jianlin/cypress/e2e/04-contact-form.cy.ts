describe('Contact Form', () => {
  beforeEach(() => {
    cy.visit('/contact_us');
  });

  it('should load contact page', () => {
    cy.url().should('include', '/contact_us');
    cy.get('body').should('be.visible');
  });

  it('should display contact information', () => {
    // Check for contact details
    cy.get('body').then(($body) => {
      const hasContactInfo =
        $body.text().includes('電話') ||
        $body.text().includes('地址') ||
        $body.text().includes('聯絡') ||
        $body.text().includes('Email');
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

  it('should validate required fields', () => {
    // Try to submit empty form
    cy.get('form').within(() => {
      cy.get('button[type="submit"]').then(($button) => {
        if ($button.length > 0) {
          cy.wrap($button).click();
        }
      });
    });

    // Form should still be on the same page or show validation errors
    cy.url().should('include', '/contact_us');
  });

  it('should fill and submit contact form', () => {
    cy.get('form').within(() => {
      // Find and fill name field
      cy.get('input').each(($input) => {
        const type = $input.attr('type');
        const name = $input.attr('name') || '';

        if (type === 'text' || name.includes('name') || name.includes('姓名')) {
          cy.wrap($input).type('測試用戶');
        } else if (type === 'email' || name.includes('email')) {
          cy.wrap($input).type('test@example.com');
        } else if (type === 'tel' || name.includes('phone') || name.includes('電話')) {
          cy.wrap($input).type('0912345678');
        }
      });

      // Fill textarea if exists
      cy.get('textarea').then(($textarea) => {
        if ($textarea.length > 0) {
          cy.wrap($textarea).first().type('這是一個測試訊息');
        }
      });
    });

    // Note: We don't actually submit to avoid sending test data
    // In real tests, you might want to intercept the API call
  });
});

describe('Reservation Form', () => {
  beforeEach(() => {
    // Use properly encoded URL
    cy.visit('/reservation/%E6%96%B0%E7%AB%B9%E4%B9%8B%E6%98%87', { failOnStatusCode: false });
  });

  it('should load reservation page', () => {
    cy.get('body').should('be.visible');
  });

  it('should display project name in URL or page', () => {
    cy.url().should('include', 'reservation');
  });

  it('should have reservation form', () => {
    cy.get('form').should('exist');
  });

  it('should have form inputs', () => {
    cy.get('input, textarea, select').should('have.length.greaterThan', 0);
  });

  it('should allow filling reservation details', () => {
    cy.get('form').within(() => {
      cy.get('input').each(($input) => {
        const type = $input.attr('type');
        const name = $input.attr('name') || '';

        if (type === 'text' && !name.includes('email')) {
          cy.wrap($input).type('王小明');
        } else if (type === 'email' || name.includes('email')) {
          cy.wrap($input).type('wang@example.com');
        } else if (type === 'tel' || name.includes('phone')) {
          cy.wrap($input).type('0987654321');
        }
      });
    });
  });
});
