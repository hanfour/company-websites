import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT } from '@/app/api/admin/about-content/route';
import { NextRequest } from 'next/server';
import * as auth from '@/lib/auth/auth';
import * as db from '@/lib/data/db';
import type { AboutItem } from '@/types';

// Mock dependencies
vi.mock('@/lib/auth/auth');
vi.mock('@/lib/data/db');

describe('About Content API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/admin/about-content', () => {
    it('should reject unauthorized requests', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('UNAUTHORIZED');
    });

    it('should validate that about is an array', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: 'not an array' })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_DATA');
    });

    it('should validate that about field exists', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ other: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('INVALID_DATA');
    });

    it('should update about content successfully with empty array', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(db.updateCompany).toHaveBeenCalledWith({ about: [] });
    });

    it('should update about content with single block - text-only template', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const aboutBlocks: AboutItem[] = [
        {
          id: 'block_1',
          order: 0,
          show: true,
          title: '關於建林',
          caption: '<p>這是關於建林的內容</p>',
          layoutTemplate: 'text-only'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(db.updateCompany).toHaveBeenCalledWith({ about: aboutBlocks });
    });

    it('should update about content with multiple blocks - different templates', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const aboutBlocks: AboutItem[] = [
        {
          id: 'block_1',
          order: 0,
          show: true,
          title: '關於建林',
          caption: '<p>純文字內容</p>',
          layoutTemplate: 'text-only'
        },
        {
          id: 'block_2',
          order: 1,
          show: true,
          title: '經營理念',
          caption: '<p>經營理念內容</p>',
          src: 'images/philosophy.jpg',
          location: 'https://cdn.example.com/philosophy.jpg',
          layoutTemplate: 'text-with-top-image'
        },
        {
          id: 'block_3',
          order: 2,
          show: true,
          title: '未來展望',
          caption: '<p>未來展望內容</p>',
          src: 'images/future.jpg',
          location: 'https://cdn.example.com/future.jpg',
          layoutTemplate: 'text-with-left-image'
        },
        {
          id: 'block_4',
          order: 3,
          show: false,
          title: '售後服務',
          caption: '<p>售後服務內容</p>',
          src: 'images/service.jpg',
          layoutTemplate: 'text-with-right-image'
        },
        {
          id: 'block_5',
          order: 4,
          show: true,
          title: '公司照片',
          src: 'images/company.jpg',
          location: 'https://cdn.example.com/company.jpg',
          layoutTemplate: 'image-only'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(db.updateCompany).toHaveBeenCalledWith({ about: aboutBlocks });
    });

    it('should preserve backward compatibility with old type field', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const aboutBlocks: AboutItem[] = [
        {
          id: 'block_item_1',
          order: 0,
          show: true,
          title: '關於建林',
          caption: '<p>內容</p>',
          layoutTemplate: 'text-only',
          type: 'item_1' // 保留舊欄位
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
    });

    it('should handle update failure', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(false);

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('UPDATE_FAILED');
    });

    it('should handle internal errors', async () => {
      vi.mocked(auth.getCurrentUser).mockRejectedValue(new Error('Auth service error'));

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: [] })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should handle JSON parse errors', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: 'invalid json'
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('INTERNAL_ERROR');
    });

    it('should update blocks in correct order', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const aboutBlocks: AboutItem[] = [
        {
          id: 'block_3',
          order: 2,
          show: true,
          title: '第三個',
          caption: '<p>第三</p>',
          layoutTemplate: 'text-only'
        },
        {
          id: 'block_1',
          order: 0,
          show: true,
          title: '第一個',
          caption: '<p>第一</p>',
          layoutTemplate: 'text-only'
        },
        {
          id: 'block_2',
          order: 1,
          show: true,
          title: '第二個',
          caption: '<p>第二</p>',
          layoutTemplate: 'text-only'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(db.updateCompany).toHaveBeenCalledWith({ about: aboutBlocks });
    });

    it('should handle blocks with show=false', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const aboutBlocks: AboutItem[] = [
        {
          id: 'block_1',
          order: 0,
          show: false, // 隱藏的區塊
          title: '隱藏區塊',
          caption: '<p>這不會顯示</p>',
          layoutTemplate: 'text-only'
        }
      ];

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
    });

    it('should handle blocks with all layout templates', async () => {
      vi.mocked(auth.getCurrentUser).mockResolvedValue({ account: 'admin', password: 'hash' });
      vi.mocked(db.updateCompany).mockResolvedValue(true);

      const layoutTemplates: Array<'text-only' | 'text-with-top-image' | 'text-with-left-image' | 'text-with-right-image' | 'image-only'> = [
        'text-only',
        'text-with-top-image',
        'text-with-left-image',
        'text-with-right-image',
        'image-only'
      ];

      const aboutBlocks: AboutItem[] = layoutTemplates.map((template, index) => ({
        id: `block_${index}`,
        order: index,
        show: true,
        title: `區塊 ${template}`,
        caption: template !== 'image-only' ? `<p>${template} 內容</p>` : undefined,
        src: template !== 'text-only' ? `images/${template}.jpg` : undefined,
        location: template !== 'text-only' ? `https://cdn.example.com/${template}.jpg` : undefined,
        layoutTemplate: template
      }));

      const request = new NextRequest('http://localhost:3000/api/admin/about-content', {
        method: 'PUT',
        body: JSON.stringify({ about: aboutBlocks })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('SUCCESS');
      expect(db.updateCompany).toHaveBeenCalledWith({ about: aboutBlocks });
    });
  });
});
