describe('Admin Contacts Management', () => {
  // Login helper
  const login = () => {
    cy.visit('/admin/login');
    cy.get('input[name="account"], input[type="text"]').type('admin@test.com');
    cy.get('input[name="password"], input[type="password"]').type('admin123');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/admin');
  };

  beforeEach(() => {
    login();
  });

  describe('Contact List Page', () => {
    it('should navigate to contacts management from admin menu', () => {
      // Check if contacts link exists in nav
      cy.get('nav, header').within(() => {
        cy.contains(/聯絡表單|聯絡/i).should('exist');
      });
    });

    it('should load contacts list page', () => {
      cy.visit('/admin/contacts');
      cy.url().should('include', '/admin/contacts');
      cy.get('body').should('be.visible');
    });

    it('should display filter tabs', () => {
      cy.visit('/admin/contacts');

      // Check for status filter tabs
      const tabs = ['全部', '待處理', '已回復', '已歸檔'];
      tabs.forEach(tab => {
        cy.contains(tab).should('exist');
      });
    });

    it('should filter contacts by status', () => {
      cy.visit('/admin/contacts');

      // Click on different status tabs
      cy.contains('待處理').click();
      cy.url().should('not.include', 'status=replied');

      cy.contains('已回復').click();
      cy.wait(500); // Wait for data to load

      cy.contains('已歸檔').click();
      cy.wait(500);

      cy.contains('全部').click();
      cy.wait(500);
    });

    it('should display contacts in table format', () => {
      cy.visit('/admin/contacts');

      // Wait for potential data to load
      cy.wait(1000);

      // Check for table structure (if contacts exist)
      cy.get('body').then(($body) => {
        if ($body.find('table').length > 0) {
          cy.get('table').should('exist');
          cy.get('thead').should('exist');
          cy.get('tbody').should('exist');

          // Check for table headers
          const headers = ['狀態', '姓名', 'Email', '分類', '提交時間', '操作'];
          headers.forEach(header => {
            cy.get('thead').should('contain', header);
          });
        } else {
          // If no contacts, should show empty state
          cy.contains(/暫無|沒有/i).should('exist');
        }
      });
    });

    it('should have view detail button for each contact', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          // If contacts exist, check for detail button
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).should('exist');
          });
        }
      });
    });
  });

  describe('Contact Detail Page', () => {
    it('should navigate to contact detail page', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          // Click first contact detail button
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          cy.url().should('include', '/admin/contacts/');
        } else {
          // Skip test if no contacts
          cy.log('No contacts available for detail test');
        }
      });
    });

    it('should display contact information', () => {
      // Create a test contact first by visiting the form
      cy.visit('/contact_us');

      cy.get('form').within(() => {
        cy.get('input[name="name"]').type('E2E Test User');
        cy.get('input[name="email"]').type('e2e-test@example.com');
        cy.get('input[name="phone"]').type('0912345678');
        cy.get('input[name="subject"]').type('E2E Test Subject');
        cy.get('textarea[name="message"]').type('This is an E2E test message');
      });

      // Intercept the API call
      cy.intercept('POST', '/api/contact').as('contactSubmit');

      cy.get('button[type="submit"]').click();

      // Wait for submission
      cy.wait('@contactSubmit').its('response.statusCode').should('eq', 200);

      // Now go to admin and check the contact
      login();
      cy.visit('/admin/contacts');
      cy.wait(1000);

      // Find and click the test contact
      cy.contains('E2E Test User').should('exist');
      cy.contains('E2E Test User').closest('tr').within(() => {
        cy.contains(/查看|詳情/i).click();
      });

      // Verify detail page shows correct info
      cy.contains('E2E Test User').should('exist');
      cy.contains('e2e-test@example.com').should('exist');
      cy.contains('0912345678').should('exist');
      cy.contains('This is an E2E test message').should('exist');
    });

    it('should have admin reply textarea', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          // Check for reply section
          cy.contains(/管理員回復|回復/i).should('exist');
          cy.get('textarea').should('exist');
        }
      });
    });

    it('should have status update buttons', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          // Check for status buttons
          cy.contains(/待處理/i).should('exist');
          cy.contains(/已回復/i).should('exist');
          cy.contains(/歸檔/i).should('exist');
        }
      });
    });

    it('should have delete button', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          // Check for delete button
          cy.contains(/刪除/i).should('exist');
        }
      });
    });

    it('should update contact status', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          // Intercept the update API call
          cy.intercept('PATCH', '/api/admin/contacts/*').as('updateContact');

          // Try to update status (if button is not disabled)
          cy.get('button').contains(/歸檔/i).then(($btn) => {
            if (!$btn.is(':disabled')) {
              cy.wrap($btn).click();
              cy.wait('@updateContact');

              // Should show success message
              cy.on('window:alert', (text) => {
                expect(text).to.contains(/成功/);
              });
            }
          });
        }
      });
    });

    it('should save admin reply', () => {
      cy.visit('/admin/contacts');
      cy.wait(1000);

      cy.get('body').then(($body) => {
        if ($body.find('table tbody tr').length > 0) {
          cy.get('table tbody tr').first().within(() => {
            cy.contains(/查看|詳情/i).click();
          });

          // Type reply
          cy.get('textarea').clear().type('This is a test admin reply');

          // Intercept the update API call
          cy.intercept('PATCH', '/api/admin/contacts/*').as('saveReply');

          // Click save reply button
          cy.contains(/保存回復|保存/i).click();
          cy.wait('@saveReply');

          // Should show success message
          cy.on('window:alert', (text) => {
            expect(text).to.contains(/成功/);
          });
        }
      });
    });
  });

  describe('Contact Form Submission Flow', () => {
    it('should submit contact form and appear in admin', () => {
      const timestamp = Date.now();
      const testEmail = `test-${timestamp}@example.com`;

      // Step 1: Submit contact form
      cy.visit('/contact_us');

      cy.get('form').within(() => {
        cy.get('input[name="name"]').type(`Test User ${timestamp}`);
        cy.get('input[name="email"]').type(testEmail);
        cy.get('input[name="phone"]').type('0912345678');
        cy.get('input[name="subject"]').type('Test Subject');
        cy.get('textarea[name="message"]').type('Test message content');
      });

      cy.intercept('POST', '/api/contact').as('submitContact');
      cy.get('button[type="submit"]').click();
      cy.wait('@submitContact').its('response.statusCode').should('eq', 200);

      // Step 2: Login to admin
      login();

      // Step 3: Navigate to contacts
      cy.visit('/admin/contacts');
      cy.wait(1000);

      // Step 4: Verify contact appears in list
      cy.contains(testEmail).should('exist');

      // Step 5: Open contact detail
      cy.contains(testEmail).closest('tr').within(() => {
        cy.contains(/查看|詳情/i).click();
      });

      // Step 6: Verify all information
      cy.contains(`Test User ${timestamp}`).should('exist');
      cy.contains(testEmail).should('exist');
      cy.contains('0912345678').should('exist');
      cy.contains('Test message content').should('exist');
    });
  });
});
