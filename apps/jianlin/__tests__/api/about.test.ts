import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/about/route';
import { PUT } from '@/app/api/admin/about/[type]/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('About API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/about', () => {
    it('should return about items successfully', async () => {
      const mockItems = {
        item_1: { title: 'About 1', src: '/about1.jpg', description: 'Description 1' },
        item_2: { title: 'About 2', src: '/about2.jpg', description: 'Description 2' },
        item_3: { title: 'About 3', src: '/about3.jpg', description: 'Description 3' },
        item_4: { title: 'About 4', src: '/about4.jpg', description: 'Description 4' }
      };

      vi.mocked(db.getAboutItems).mockResolvedValue(mockItems);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual(mockItems);
      expect(db.getAboutItems).toHaveBeenCalledOnce();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.getAboutItems).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should handle empty content', async () => {
      vi.mocked(db.getAboutItems).mockResolvedValue({});

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual({});
    });
  });

  describe('PUT /api/admin/about/[type]', () => {
    const validTypes = ['item_1', 'item_2', 'item_3', 'item_4'];

    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should validate type parameter - invalid type', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/about/invalid', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test', src: '/test.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_TYPE');
    });

    it('should validate type parameter - item_5 not allowed', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_5', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test', src: '/test.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_5' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_TYPE');
    });

    it('should validate required field - title', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
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

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Test' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    validTypes.forEach(type => {
      it(`should update ${type} successfully`, async () => {
        vi.mocked(auth.isAdmin).mockResolvedValue(true);
        vi.mocked(db.updateAboutItem).mockResolvedValue(true);

        const updateData = {
          title: `Updated ${type}`,
          src: `/updated-${type}.jpg`,
          description: `Updated description for ${type}`
        };

        const request = new NextRequest(`http://localhost:3000/api/admin/about/${type}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });

        const response = await PUT(request, { params: Promise.resolve({ type }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.updateAboutItem).toHaveBeenCalledWith(type, updateData);
      });
    });

    it('should handle update failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateAboutItem).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('UPDATE_FAILED');
    });

    it('should handle internal errors', async () => {
      vi.mocked(auth.isAdmin).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated', src: '/updated.jpg' })
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should update with all optional fields', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateAboutItem).mockResolvedValue(true);

      const updateData = {
        title: 'Complete About Item',
        src: '/complete.jpg',
        description: 'This is a complete description with all fields',
        link: '/learn-more',
        order: 1
      };

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should update only required fields', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateAboutItem).mockResolvedValue(true);

      const minimalData = {
        title: 'Minimal About Item',
        src: '/minimal.jpg'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/about/item_1', {
        method: 'PUT',
        body: JSON.stringify(minimalData)
      });

      const response = await PUT(request, { params: Promise.resolve({ type: 'item_1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
