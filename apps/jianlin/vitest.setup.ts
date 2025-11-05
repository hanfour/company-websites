import { expect, afterEach, vi } from 'vitest';
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

// Mock AWS credentials for tests (prevent S3 client initialization errors)
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.AWS_S3_REGION = 'ap-northeast-1';
process.env.AWS_S3_PREFIX = 'test/';

// Mock AWS API Gateway for email service
process.env.API_GATEWAY_URL = 'https://test-api-gateway.execute-api.ap-northeast-1.amazonaws.com/prod';
process.env.API_GATEWAY_API_KEY = 'test-api-key';

// Ensure tests use local files, not S3
process.env.NODE_ENV = 'test';
process.env.FORCE_S3 = 'false';

// Mock S3 storage module to prevent actual S3 calls
vi.mock('@/lib/data/s3-storage', () => ({
  readJSON: vi.fn().mockResolvedValue(null),
  writeJSON: vi.fn().mockResolvedValue(true),
  listJSON: vi.fn().mockResolvedValue([]),
  deleteJSON: vi.fn().mockResolvedValue(true),
}));
