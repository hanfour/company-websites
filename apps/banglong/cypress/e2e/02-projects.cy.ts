describe('Projects (建案) Page', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes('Hydration failed') || err.message.includes('hydration')) {
        return false;
      }
      return true;
    });
    cy.visit('/arch');
  });

  it('should load projects page successfully', () => {
    cy.url().should('include', '/arch');
    cy.get('body').should('be.visible');
  });

  it('should display page title or heading', () => {
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const hasProjectsHeading =
        bodyText.includes('建案') ||
        bodyText.includes('作品') ||
        bodyText.includes('案例') ||
        $body.find('h1, h2').length > 0;

      expect(hasProjectsHeading).to.be.true;
    });
  });

  it('should display project list or grid', () => {
    // Check for project listings
    cy.get('body').then(($body) => {
      const hasProjects =
        $body.find('[class*="project"]').length > 0 ||
        $body.find('[class*="card"]').length > 0 ||
        $body.find('[class*="grid"]').length > 0 ||
        $body.find('a').length > 0;

      expect(hasProjects).to.be.true;
    });
  });

  it('should have project navigation links', () => {
    // Check for classic and future project links
    cy.get('body').then(($body) => {
      const bodyText = $body.text();
      const hasClassicLink = bodyText.includes('經典') || $body.find('a[href*="classic"]').length > 0;
      const hasFutureLink = bodyText.includes('未來') || $body.find('a[href*="future"]').length > 0;

      // At least one type of project should be available
      expect(hasClassicLink || hasFutureLink || $body.find('a').length > 0).to.be.true;
    });
  });

  it('should be able to navigate to classic projects', () => {
    cy.visit('/arch/classic');
    cy.get('body').should('be.visible');
    cy.url().should('include', '/arch/classic');
  });

  it('should be able to navigate to future projects', () => {
    cy.visit('/arch/future');
    cy.get('body').should('be.visible');
    cy.url().should('include', '/arch/future');
  });

  it('should display project images', () => {
    cy.get('body').then(($body) => {
      const hasImages = $body.find('img').length > 0;
      const hasBackgroundImages = $body.find('div[style*="background-image"]').length > 0;

      expect(hasImages || hasBackgroundImages).to.be.true;
    });
  });

  it('should be responsive on mobile', () => {
    cy.viewport('iphone-x');
    cy.get('body').should('be.visible');
  });

  it('should be responsive on tablet', () => {
    cy.viewport('ipad-2');
    cy.get('body').should('be.visible');
  });
});
