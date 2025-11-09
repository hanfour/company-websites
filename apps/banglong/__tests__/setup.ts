/**
 * Test Setup for Banglong
 *
 * This file runs before all tests.
 * Configure global test environment here.
 */

// Load environment variables for testing
import { config } from 'dotenv';
config({ path: '.env.test.local' });
config({ path: '.env.local' }); // Also load .env.local for S3 credentials
config({ path: '.env' });

// Set test environment
// Note: NODE_ENV is read-only in some environments, so we don't set it here
// The test runner (vitest) will set it automatically

// Suppress console output during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: () => {},
    debug: () => {},
    info: () => {},
    warn: () => {},
  } as any;
}
