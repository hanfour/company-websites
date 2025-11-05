import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, PUT } from '@/app/api/admin/carousel/route';
import { PUT as PUT_INDEX, DELETE } from '@/app/api/admin/carousel/[index]/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('Carousel API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/carousel', () => {
    it('should return carousel items successfully', async () => {
      const mockItems = [
        { name: 'Test 1', src: '/test1.jpg', location: '/' },
        { name: 'Test 2', src: '/test2.jpg', location: '/' }
      ];

      vi.mocked(db.getCarouselItems).mockResolvedValue(mockItems);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.items).toEqual(mockItems);
      expect(db.getCarouselItems).toHaveBeenCalledOnce();
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.getCarouselItems).mockRejectedValue(new Error('Database error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });

  describe('POST /api/admin/carousel', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', src: '/test.jpg', location: '/' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should validate required fields', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }) // Missing src and location
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should create carousel item successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.addCarouselItem).mockResolvedValue(true);

      const carouselData = { name: 'Test', src: '/test.jpg', location: '/' };
      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'POST',
        body: JSON.stringify(carouselData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(db.addCarouselItem).toHaveBeenCalledWith(carouselData);
    });

    it('should handle creation failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.addCarouselItem).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', src: '/test.jpg', location: '/' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('CREATE_FAILED');
    });
  });

  describe('PUT /api/admin/carousel (reorder)', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'PUT',
        body: JSON.stringify({ items: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should validate items array', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'PUT',
        body: JSON.stringify({ items: 'not-an-array' })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_DATA');
    });

    it('should reorder carousel items successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.reorderCarouselItems).mockResolvedValue(true);

      const items = [
        { name: 'Test 1', src: '/test1.jpg', location: '/' },
        { name: 'Test 2', src: '/test2.jpg', location: '/' }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/carousel', {
        method: 'PUT',
        body: JSON.stringify({ items })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.reorderCarouselItems).toHaveBeenCalledWith(items);
    });
  });

  describe('PUT /api/admin/carousel/[index]', () => {
    it('should validate index parameter', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel/abc', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test', src: '/test.jpg', location: '/' })
      });

      const response = await PUT_INDEX(request, { params: Promise.resolve({ index: 'abc' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_INDEX');
    });

    it('should update carousel item successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateCarouselItem).mockResolvedValue(true);

      const carouselData = { name: 'Updated', src: '/updated.jpg', location: '/updated' };
      const request = new NextRequest('http://localhost:3000/api/admin/carousel/0', {
        method: 'PUT',
        body: JSON.stringify(carouselData)
      });

      const response = await PUT_INDEX(request, { params: Promise.resolve({ index: '0' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateCarouselItem).toHaveBeenCalledWith(0, carouselData);
    });
  });

  describe('DELETE /api/admin/carousel/[index]', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel/0', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ index: '0' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should delete carousel item successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.deleteCarouselItem).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/carousel/0', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ index: '0' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.deleteCarouselItem).toHaveBeenCalledWith(0);
    });
  });
});
