import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/home-content/route';
import { PUT } from '@/app/api/admin/home-content/[type]/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('Home Content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/home-content', () => {
    it('should return home content items successfully', async () => {
      const mockItems = {
        item_1: { name: 'Item 1', src: '/item1.jpg', description: 'Description 1' },
        item_2: { name: 'Item 2', src: '/item2.jpg', description: 'Description 2' },
        item_3: { name: 'Item 3', src: '/item3.jpg', description: 'Description 3' }
      };

      vi.mocked(db.getHomeContent).mockResolvedValue(mockItems);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual(mockItems);
      expect(db.getHomeContent).toHaveBeenCalledOnce();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.getHomeContent).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should handle empty content', async () => {
      vi.mocked(db.getHomeContent).mockResolvedValue({});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual({});
    });
  });

  describe('PUT /api/admin/home-content/[type]', () => {
    const validTypes = ['item_1', 'item_2', 'item_3'];

    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should validate type parameter', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/invalid', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', src: '/test.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_TYPE');
    });

    it('should validate required field - name', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify({ src: '/test.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should validate required field - src', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    validTypes.forEach(type => {
      it(`should update ${type} successfully`, async () => {
        vi.mocked(auth.isAdmin).mockResolvedValue(true);
        vi.mocked(db.updateHomeContentItem).mockResolvedValue(true);

        const updateData = {
          name: `Updated ${type}`,
          src: `/updated-${type}.jpg`,
          description: `Updated description for ${type}`
        };

        const request = new NextRequest(`http://localhost:3000/api/admin/home-content/${type}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        const response = await PUT(request, { params: Promise.resolve({ type }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.updateHomeContentItem).toHaveBeenCalledWith(type, updateData);
      });
    });

    it('should handle update failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateHomeContentItem).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('UPDATE_FAILED');
    });

    it('should handle internal errors', async () => {
      vi.mocked(auth.isAdmin).mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should update with optional fields', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateHomeContentItem).mockResolvedValue(true);

      const updateData = {
        name: 'With Description',
        src: '/with-desc.jpg',
        description: 'This is a detailed description',
        link: '/learn-more'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/home-content/item_1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
