import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/admin/cases/route';
import { PUT } from '@/app/api/admin/cases/[id]/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('Cases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/admin/cases', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'HOT001',
          name: 'Test Case',
          type: 'hot'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
      expect(db.createCase).not.toHaveBeenCalled();
    });

    it('should validate required fields - missing numberID', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Case',
          type: 'hot'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should validate required fields - missing name', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'HOT001',
          type: 'hot'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should validate required fields - missing type', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'HOT001',
          name: 'Test Case'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
    });

    it('should create case successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.createCase).mockResolvedValue(true);

      const caseData = {
        numberID: 'HOT001',
        id: 1,
        name: 'Test Case',
        sub: '',
        caption: '',
        outline: '',
        address: 'Test Location',
        slider: [],
        src: [{ name: 'test.jpg', src: 'test.jpg', location: '/test.jpg' }],
        status: 0,
        type: 'hot' as const,
        data_uploader: '2025-01-01',
        data_editor: '2025-01-01',
      };

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify(caseData)
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(db.createCase).toHaveBeenCalledWith(caseData);
    });

    it('should handle creation failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.createCase).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'HOT001',
          name: 'Test Case',
          type: 'hot'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('CREATE_FAILED');
    });

    it('should handle internal errors', async () => {
      vi.mocked(auth.isAdmin).mockRejectedValue(new Error('Auth service down'));

      const request = new NextRequest('http://localhost:3000/api/admin/cases', {
        method: 'POST',
        body: JSON.stringify({
          numberID: 'HOT001',
          name: 'Test Case',
          type: 'hot'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });

  describe('PUT /api/admin/cases/[id]', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/cases/hot001', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'hot001' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should update case successfully', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateCase).mockResolvedValue(true);

      const updateData = {
        name: 'Updated Case Name',
        address: 'New Location'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/cases/hot001', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'hot001' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateCase).toHaveBeenCalledWith('hot001', updateData);
    });

    it('should handle update failure', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateCase).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/cases/hot001', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Updated Name' })
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'hot001' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('UPDATE_FAILED');
    });

    it('should handle partial updates', async () => {
      vi.mocked(auth.isAdmin).mockResolvedValue(true);
      vi.mocked(db.updateCase).mockResolvedValue(true);

      const partialUpdate = {
        address: 'New Location Only'
      };

      const request = new NextRequest('http://localhost:3000/api/admin/cases/hot001', {
        method: 'PUT',
        body: JSON.stringify(partialUpdate)
      });

      const response = await PUT(request, { params: Promise.resolve({ id: 'hot001' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateCase).toHaveBeenCalledWith('hot001', partialUpdate);
    });
  });
});
