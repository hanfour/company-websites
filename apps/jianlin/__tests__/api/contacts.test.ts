import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/admin/contacts/route';
import { GET as GetById, PATCH, DELETE } from '@/app/api/admin/contacts/[id]/route';
import { POST as ContactSubmit } from '@/app/api/contact/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');
vi.mock('@/lib/services/email-service', () => ({
  default: {
    send: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('Contact Form API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/contact', () => {
    it('should create contact message and send email', async () => {
      const mockContact = {
        id: 'test-123',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'pending' as const,
        name: 'Test User',
        email: 'test@example.com',
        phone: '0912345678',
        category: '測試分類',
        subject: '測試主旨',
        message: '測試訊息'
      };

      vi.mocked(db.createContactMessage).mockResolvedValue(mockContact);

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          phone: '0912345678',
          category: '測試分類',
          subject: '測試主旨',
          message: '測試訊息'
        })
      });

      const response = await ContactSubmit(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.contactId).toBe('test-123');
      expect(db.createContactMessage).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User'
          // missing email and message
        })
      });

      const response = await ContactSubmit(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MISSING_FIELDS');
      expect(db.createContactMessage).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      vi.mocked(db.createContactMessage).mockRejectedValue(new Error('DB error'));

      const request = new NextRequest('http://localhost:3000/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          message: 'Test'
        })
      });

      const response = await ContactSubmit(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });
  });
});

describe('Admin Contacts API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/admin/contacts', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
      expect(db.getContactMessages).not.toHaveBeenCalled();
    });

    it('should reject non-admin users', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'user@test.com',
        password: 'hash',
        type: 0 // non-admin
      });

      const request = new NextRequest('http://localhost:3000/api/admin/contacts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should return all contacts for admin', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      const mockContacts = [
        {
          id: '1',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'pending' as const,
          name: 'User 1',
          email: 'user1@test.com',
          message: 'Test 1'
        },
        {
          id: '2',
          createdAt: '2025-01-02T00:00:00.000Z',
          status: 'replied' as const,
          name: 'User 2',
          email: 'user2@test.com',
          message: 'Test 2'
        }
      ];

      vi.mocked(db.getContactMessages).mockResolvedValue(mockContacts);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockContacts);
      expect(data.total).toBe(2);
    });

    it('should filter contacts by status', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      const mockContacts = [
        {
          id: '1',
          createdAt: '2025-01-01T00:00:00.000Z',
          status: 'pending' as const,
          name: 'User 1',
          email: 'user1@test.com',
          message: 'Test 1'
        }
      ];

      vi.mocked(db.getContactMessages).mockResolvedValue(mockContacts);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts?status=pending');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].status).toBe('pending');
    });
  });

  describe('GET /api/admin/contacts/[id]', () => {
    it('should return contact detail for admin', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      const mockContact = {
        id: 'test-123',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'pending' as const,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      };

      vi.mocked(db.getContactMessageById).mockResolvedValue(mockContact);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/test-123');
      const response = await GetById(request, { params: Promise.resolve({ id: 'test-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockContact);
    });

    it('should return 404 for non-existent contact', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      vi.mocked(db.getContactMessageById).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/invalid');
      const response = await GetById(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('NOT_FOUND');
    });
  });

  describe('PATCH /api/admin/contacts/[id]', () => {
    it('should update contact status', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      vi.mocked(db.updateContactMessage).mockResolvedValue(true);
      vi.mocked(db.getContactMessageById).mockResolvedValue({
        id: 'test-123',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'archived' as const,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/test-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'archived' })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.updateContactMessage).toHaveBeenCalledWith('test-123', { status: 'archived' });
    });

    it('should add reply metadata when status is replied', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      vi.mocked(db.updateContactMessage).mockResolvedValue(true);
      vi.mocked(db.getContactMessageById).mockResolvedValue({
        id: 'test-123',
        createdAt: '2025-01-01T00:00:00.000Z',
        status: 'replied' as const,
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test',
        adminReply: 'Admin response',
        repliedAt: expect.any(String),
        repliedBy: 'admin@test.com'
      });

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/test-123', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'replied',
          adminReply: 'Admin response'
        })
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(db.updateContactMessage).toHaveBeenCalledWith(
        'test-123',
        expect.objectContaining({
          status: 'replied',
          adminReply: 'Admin response',
          repliedBy: 'admin@test.com',
          repliedAt: expect.any(String)
        })
      );
    });
  });

  describe('DELETE /api/admin/contacts/[id]', () => {
    it('should delete contact', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      vi.mocked(db.deleteContactMessage).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/test-123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'test-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(db.deleteContactMessage).toHaveBeenCalledWith('test-123');
    });

    it('should handle deletion failure', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({
        account: 'admin@test.com',
        password: 'hash',
        type: 1
      });

      vi.mocked(db.deleteContactMessage).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/contacts/test-123', {
        method: 'DELETE'
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: 'test-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('DELETE_FAILED');
    });
  });
});
