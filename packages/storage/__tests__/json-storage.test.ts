/**
 * JSONStorage Tests
 *
 * These tests verify the JSON+S3 storage implementation.
 * We mock the S3 Helper to avoid actual S3 calls.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User, Carousel } from '../src/types';

// Mock the S3 module with a clearable storage
let mockStorage = new Map<string, any>();

vi.mock('../src/utils/s3', () => {
  class S3Helper {
    async readJSON<T = any>(key: string): Promise<T | null> {
      const data = mockStorage.get(key);
      if (!data) return null;

      // Deep clone to simulate S3 behavior
      return JSON.parse(JSON.stringify(data));
    }

    async writeJSON(key: string, data: any): Promise<void> {
      // Deep clone to simulate S3 behavior
      mockStorage.set(key, JSON.parse(JSON.stringify(data)));
    }

    async delete(key: string): Promise<void> {
      mockStorage.delete(key);
    }

    async exists(key: string): Promise<boolean> {
      return mockStorage.has(key);
    }
  }

  return { S3Helper };
});

// Import after mocking
import { JSONStorage } from '../src/implementations/json-storage';

describe('JSONStorage', () => {
  let storage: JSONStorage;

  beforeEach(() => {
    // Clear mock storage between tests
    mockStorage.clear();

    // Clear all mocks
    vi.clearAllMocks();

    // Create new storage instance
    storage = new JSONStorage({
      bucket: 'test-bucket',
      region: 'us-east-1',
      accessKeyId: 'test-key',
      secretAccessKey: 'test-secret',
    });
  });

  describe('User Operations', () => {
    it('should create a user', async () => {
      const user = await storage.user.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'ADMIN',
      });

      expect(user.id).toBeTruthy();
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should find users', async () => {
      await storage.user.create({
        name: 'User 1',
        email: 'user1@example.com',
        password: 'pass1',
        role: 'ADMIN',
      });

      await storage.user.create({
        name: 'User 2',
        email: 'user2@example.com',
        password: 'pass2',
        role: 'EDITOR',
      });

      const users = await storage.user.findMany();
      expect(users).toHaveLength(2);
    });

    it('should find user by email', async () => {
      await storage.user.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      const user = await storage.user.findByEmail('test@example.com');
      expect(user).toBeTruthy();
      expect(user?.email).toBe('test@example.com');
    });

    it('should update user', async () => {
      const user = await storage.user.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      const updated = await storage.user.update(user.id, {
        name: 'Updated Name',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('test@example.com'); // Unchanged
    });

    it('should delete user', async () => {
      const user = await storage.user.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      await storage.user.delete(user.id);

      const found = await storage.user.findUnique(user.id);
      expect(found).toBeNull();
    });

    it('should prevent duplicate emails', async () => {
      await storage.user.create({
        name: 'User 1',
        email: 'same@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      await expect(
        storage.user.create({
          name: 'User 2',
          email: 'same@example.com',
          password: 'pass',
          role: 'ADMIN',
        })
      ).rejects.toThrow();
    });
  });

  describe('Carousel Operations', () => {
    it('should create carousel', async () => {
      const carousel = await storage.carousel.create({
        title: 'Test Carousel',
        subtitle: 'Subtitle',
        imageUrl: 'https://example.com/image.jpg',
        order: 0,
        isActive: true,
      });

      expect(carousel.id).toBeTruthy();
      expect(carousel.title).toBe('Test Carousel');
    });

    it('should reorder carousels', async () => {
      const c1 = await storage.carousel.create({
        title: 'Carousel 1',
        imageUrl: 'url1',
        order: 0,
        isActive: true,
      });

      const c2 = await storage.carousel.create({
        title: 'Carousel 2',
        imageUrl: 'url2',
        order: 1,
        isActive: true,
      });

      const c3 = await storage.carousel.create({
        title: 'Carousel 3',
        imageUrl: 'url3',
        order: 2,
        isActive: true,
      });

      // Reorder: c3, c1, c2
      await storage.carousel.reorder([c3.id, c1.id, c2.id]);

      const updated1 = await storage.carousel.findUnique(c1.id);
      const updated2 = await storage.carousel.findUnique(c2.id);
      const updated3 = await storage.carousel.findUnique(c3.id);

      expect(updated3?.order).toBe(0);
      expect(updated1?.order).toBe(1);
      expect(updated2?.order).toBe(2);
    });

    it('should filter active carousels', async () => {
      await storage.carousel.create({
        title: 'Active',
        imageUrl: 'url1',
        order: 0,
        isActive: true,
      });

      await storage.carousel.create({
        title: 'Inactive',
        imageUrl: 'url2',
        order: 1,
        isActive: false,
      });

      const active = await storage.carousel.findMany({
        where: { isActive: true } as any,
      });

      expect(active).toHaveLength(1);
      expect(active[0].title).toBe('Active');
    });
  });

  describe('Query Options', () => {
    it('should support ordering', async () => {
      await storage.user.create({
        name: 'Charlie',
        email: 'charlie@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      await storage.user.create({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      await storage.user.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'pass',
        role: 'ADMIN',
      });

      const ascending = await storage.user.findMany({
        orderBy: { field: 'name', direction: 'asc' },
      });

      expect(ascending[0].name).toBe('Alice');
      expect(ascending[1].name).toBe('Bob');
      expect(ascending[2].name).toBe('Charlie');

      const descending = await storage.user.findMany({
        orderBy: { field: 'name', direction: 'desc' },
      });

      expect(descending[0].name).toBe('Charlie');
      expect(descending[1].name).toBe('Bob');
      expect(descending[2].name).toBe('Alice');
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 10; i++) {
        await storage.user.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'pass',
          role: 'ADMIN',
        });
      }

      const page1 = await storage.user.findMany({ skip: 0, take: 3 });
      expect(page1).toHaveLength(3);

      const page2 = await storage.user.findMany({ skip: 3, take: 3 });
      expect(page2).toHaveLength(3);

      // Ensure different results
      expect(page1[0].email).not.toBe(page2[0].email);
    });
  });

  describe('Concurrency Control', () => {
    it('should handle concurrent writes safely', async () => {
      // Create 10 users concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        storage.user.create({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          password: 'pass',
          role: 'ADMIN',
        })
      );

      const users = await Promise.all(promises);

      // All should succeed with unique IDs
      const ids = new Set(users.map((u) => u.id));
      expect(ids.size).toBe(10);

      // Verify all are in storage
      const allUsers = await storage.user.findMany();
      expect(allUsers).toHaveLength(10);
    });
  });

  describe('Health Check', () => {
    it('should return ok status', async () => {
      const health = await storage.health();
      expect(health.status).toBe('ok');
    });
  });
});
