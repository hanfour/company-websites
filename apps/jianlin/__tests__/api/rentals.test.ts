import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/rentals/route';
import { PUT } from '@/app/api/admin/rentals/[id]/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('Rentals API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/rentals', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'R001',
          name: 'Test Rental'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
      expect(db.createRental).not.toHaveBeenCalled();
    });

    it('should validate required field - numberID', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Rental'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should validate required field - name', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'R001'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should create rental successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.createRental).mockResolvedValue(true);

      const rentalData = {
        numberID: 'R001',
        id: 1,
        name: 'Test Rental Property',
        sub: '',
        caption: '',
        address: 'Test Location',
        price: '50000',
        floor: '',
        application: '',
        property: '',
        slider: [],
        src: [],
        status: 0,
        show: true,
        data_uploader: '2025-01-01',
        data_editor: '2025-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify(rentalData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(db.createRental).toHaveBeenCalledWith(rentalData);
    });

    it('should handle creation failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.createRental).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'R001',
          name: 'Test Rental'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('CREATE_FAILED');
    });

    it('should handle internal errors', async () => {
      vi.mocked(auth.isAdmin).mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/admin/rentals', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'R001',
          name: 'Test Rental'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });

  describe('PUT /api/admin/rentals/[id]', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals/r001', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Updated Title' })
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'r001' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should update rental successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateRental).mockResolvedValue(true);

      const updateData = {
        name: 'Updated Rental Name',
        price: '55000',
        address: 'New Location'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/rentals/r001', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'r001' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateRental).toHaveBeenCalledWith('r001', updateData);
    });

    it('should handle update failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateRental).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals/r001', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'r001' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('UPDATE_FAILED');
    });

    it('should handle partial updates', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateRental).mockResolvedValue(true);

      const partialUpdate = {
        price: '60000'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/rentals/r001', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'r001' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateRental).toHaveBeenCalledWith('r001', partialUpdate);
    });

    it('should handle empty update data', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateRental).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/rentals/r001', {
        method: 'PUT',
        body: JSON.stringify({})
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'r001' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
