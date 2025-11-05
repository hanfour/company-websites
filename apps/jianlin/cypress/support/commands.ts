/// <reference types="cypress" />

// Custom commands for the Jianlin project

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to check if an image is loaded
       * @example cy.get('img').checkImageLoaded()
       */
      checkImageLoaded(): Chainable<Element>;

      /**
       * Login as admin user
       * @example cy.loginAsAdmin()
       */
      loginAsAdmin(username?: string, password?: string): Chainable<void>;

      /**
       * Create a new about block via API
       * @example cy.createAboutBlock({ title: 'Test', layoutTemplate: 'text-only' })
       */
      createAboutBlock(block: any): Chainable<any>;

      /**
       * Delete all about blocks (cleanup)
       * @example cy.cleanupAboutBlocks()
       */
      cleanupAboutBlocks(): Chainable<void>;

      /**
       * Wait for API request to complete
       * @example cy.waitForAPI('@createBlock')
       */
      waitForAPI(alias: string, timeout?: number): Chainable<any>;

      /**
       * Fill rich text editor
       * @example cy.fillRichTextEditor('My content')
       */
      fillRichTextEditor(content: string): Chainable<void>;

      /**
       * Check if element is in viewport
       * @example cy.get('.element').isInViewport()
       */
      isInViewport(): Chainable<boolean>;
    }
  }
}

// Check if image is loaded
Cypress.Commands.add('checkImageLoaded', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('be.visible').and(($img) => {
    expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
  });
});

// Login as admin
Cypress.Commands.add('loginAsAdmin', (username = 'admin', password = 'admin123') => {
  cy.session([username, password], () => {
    cy.visit('/login');
    cy.get('input[name="account"], input[type="text"]').first().clear().type(username);
    cy.get('input[name="password"], input[type="password"]').first().clear().type(password);
    cy.get('button[type="submit"], button:contains("登入")').first().click();

    // Wait for redirect or successful login
    cy.url().should('not.include', '/login');
  }, {
    cacheAcrossSpecs: true
  });
});

// Create about block via API
Cypress.Commands.add('createAboutBlock', (block) => {
  return cy.request({
    method: 'PUT',
    url: '/api/admin/about-content',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      about: [block]
    },
    failOnStatusCode: false
  });
});

// Cleanup about blocks
Cypress.Commands.add('cleanupAboutBlocks', () => {
  cy.request({
    method: 'PUT',
    url: '/api/admin/about-content',
    headers: {
      'Content-Type': 'application/json',
    },
    body: {
      about: []
    },
    failOnStatusCode: false
  });
});

// Wait for API
Cypress.Commands.add('waitForAPI', (alias, timeout = 10000) => {
  return cy.wait(alias, { timeout });
});

// Fill rich text editor (TipTap)
Cypress.Commands.add('fillRichTextEditor', (content) => {
  // Find the TipTap editor and type content
  cy.get('.tiptap, [contenteditable="true"]').first().then(($editor) => {
    $editor.html(content);
    cy.wrap($editor).type(' {backspace}'); // Trigger change event
  });
});

// Check if in viewport
Cypress.Commands.add('isInViewport', { prevSubject: true }, (subject) => {
  const rect = subject[0].getBoundingClientRect();

  cy.window().then((win) => {
    const isInViewport = (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= win.innerHeight &&
      rect.right <= win.innerWidth
    );
    return cy.wrap(isInViewport);
  });
});

export {};
