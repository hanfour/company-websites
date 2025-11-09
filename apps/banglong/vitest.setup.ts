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
process.env.NEXT_PUBLIC_SITE_NAME = '邦瓏建設';

// Mock AWS/S3 credentials for tests (prevent S3 client initialization errors)
process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
process.env.S3_BUCKET = 'test-bucket';
process.env.S3_REGION = 'ap-northeast-1';

// Mock AWS API Gateway for email service
process.env.API_GATEWAY_URL = 'https://test-api-gateway.execute-api.ap-northeast-1.amazonaws.com/prod';
process.env.API_GATEWAY_API_KEY = 'test-api-key';

// Ensure tests use test environment
process.env.NODE_ENV = 'test';
process.env.STORAGE_TYPE = 'json';

// Mock NextAuth
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
