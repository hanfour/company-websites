import { describe, it, expect } from 'vitest';
import { apiTester } from '@repo/testing';

/**
 * Admin API Integration Tests
 *
 * These tests verify authenticated admin endpoints.
 * Note: These tests assume the server is running and admin session exists.
 */

const api = apiTester({
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
});

describe('Admin API Protection', () => {
  describe('GET /api/handbooks/admin', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await api.get('/api/handbooks/admin');

      expect(result.response?.status).toBe(401);
    });
  });

  describe('GET /api/carousel/admin', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await api.get('/api/carousel/admin');

      expect(result.response?.status).toBe(401);
    });
  });

  describe('GET /api/projects/admin', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await api.get('/api/projects/admin');

      expect(result.response?.status).toBe(401);
    });
  });

  describe('GET /api/contacts/admin', () => {
    it('should reject unauthenticated requests', async () => {
      const result = await api.get('/api/contacts/admin');

      expect(result.response?.status).toBe(401);
    });
  });

  describe('POST /api/users', () => {
    it('should reject unauthenticated user creation', async () => {
      const result = await api.post('/api/users', {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.response?.status).toBe(401);
    });
  });
});

describe('Admin Data Management', () => {
  describe('PUT endpoints', () => {
    it('should protect handbook updates', async () => {
      const result = await api.put('/api/handbooks/admin/test-id', {
        title: 'Updated Title',
      });

      expect(result.response?.status).toBe(401);
    });

    it('should protect carousel updates', async () => {
      const result = await api.put('/api/carousel/test-id', {
        title: 'Updated Title',
      });

      // Should be 401 (unauthorized) or 405 (method not allowed)
      expect([401, 404, 405]).toContain(result.response?.status);
    });
  });

  describe('DELETE endpoints', () => {
    it('should protect handbook deletion', async () => {
      const result = await api.delete('/api/handbooks/admin/test-id');

      expect(result.response?.status).toBe(401);
    });

    it('should protect carousel deletion', async () => {
      const result = await api.delete('/api/carousel/test-id');

      expect(result.response?.status).toBe(401);
    });
  });
});
