import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NEXT_PUBLIC_CDN_LINK = 'https://d377o53dybsd55.cloudfront.net';
process.env.NEXT_PUBLIC_SITE_NAME = '建林工業股份有限公司';
