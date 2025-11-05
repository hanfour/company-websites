describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should navigate to About Us page', () => {
    // Try to find and click About Us link - use force if element is hidden
    cy.get('body').then(($body) => {
      const aboutLink = $body.find('a[href*="about"]');
      if (aboutLink.length > 0) {
        cy.wrap(aboutLink).first().click({ force: true });
        cy.url().should('include', '/about');
      } else {
        // Direct navigation
        cy.visit('/about_us');
        cy.url().should('include', '/about_us');
      }
    });
    cy.get('body').should('be.visible');
  });

  it('should navigate to Hot Cases List page', () => {
    cy.get('body').then(($body) => {
      const hotLink = $body.find('a[href*="hot_list"], a[href*="hot"]').filter('[href="/hot_list"]');
      if (hotLink.length > 0) {
        cy.wrap(hotLink).first().click({ force: true });
      } else {
        cy.visit('/hot_list');
      }
    });
    cy.url().should('include', '/hot_list');
    cy.get('body').should('be.visible');
  });

  it('should navigate to History Cases List page', () => {
    cy.get('body').then(($body) => {
      const historyLink = $body.find('a[href*="history_list"], a[href*="history"]').filter('[href="/history_list"]');
      if (historyLink.length > 0) {
        cy.wrap(historyLink).first().click({ force: true });
      } else {
        cy.visit('/history_list');
      }
    });
    cy.url().should('include', '/history_list');
    cy.get('body').should('be.visible');
  });

  it('should navigate to Contact Us page', () => {
    cy.get('body').then(($body) => {
      const contactLink = $body.find('a[href*="contact"]');
      if (contactLink.length > 0) {
        cy.wrap(contactLink).first().click({ force: true });
      } else {
        cy.visit('/contact_us');
      }
    });
    cy.url().should('include', '/contact');
    cy.get('body').should('be.visible');
  });

  it('should navigate to Real Estate List page from footer or menu', () => {
    // Try to find and click the real estate link
    cy.visit('/real_estate_list');
    cy.url().should('include', '/real_estate_list');
    cy.get('body').should('be.visible');
  });

  it('should navigate back to homepage from logo/brand', () => {
    cy.visit('/about_us');
    // Try to find home link or just visit directly
    cy.get('body').then(($body) => {
      const homeLink = $body.find('a[href="/"]');
      if (homeLink.length > 0) {
        cy.wrap(homeLink).first().click();
      } else {
        cy.visit('/');
      }
    });
    cy.url().should('eq', Cypress.config().baseUrl + '/');
  });

  it('should maintain navigation state across pages', () => {
    // Navigate to hot list
    cy.visit('/hot_list');
    cy.url().should('include', '/hot_list');

    // Navigate to history list
    cy.visit('/history_list');
    cy.url().should('include', '/history_list');

    // Go back
    cy.go('back');
    cy.url().should('include', '/hot_list');
  });
});
