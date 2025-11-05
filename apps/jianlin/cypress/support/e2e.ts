// ***********************************************************
// This file is processed and loaded automatically before your test files.
//
// You can change the location of this file or turn off automatically serving
// support files with the 'supportFile' configuration option.
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Handle uncaught exceptions globally
Cypress.on('uncaught:exception', (err) => {
  // Ignore hydration errors in Next.js development mode
  if (
    err.message.includes('Hydration') ||
    err.message.includes('hydration') ||
    err.message.includes('Minified React error')
  ) {
    return false;
  }
  // Let other errors fail the test
  return true;
});
