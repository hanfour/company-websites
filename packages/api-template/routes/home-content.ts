import { NextRequest, NextResponse } from 'next/server';
import type { HomeContent } from '@repo/types';

/**
 * Home Content 資料來源介面
 * 每個專案實作自己的資料存取邏輯（JSON 檔案、資料庫等）
 */
export interface HomeContentDataSource {
  getHomeContent(): Promise<HomeContent>;
  getHomeContentByType(type: keyof HomeContent): Promise<any>;
  updateHomeContentByType(type: keyof HomeContent, data: any): Promise<boolean>;
}

/**
 * 建立 Home Content API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數（用於需要權限的操作）
 * @returns API 路由處理器
 */
export function createHomeContentAPI(
  dataSource: HomeContentDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/home-content
     * 取得所有首頁內容
     */
    async GET() {
      try {
        const content = await dataSource.getHomeContent();
        return NextResponse.json({ content }, { status: 200 });
      } catch (error) {
        console.error('Get home content error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得首頁內容' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * 建立 Home Content by Type API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數
 * @returns API 路由處理器
 */
export function createHomeContentByTypeAPI(
  dataSource: HomeContentDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/home-content/[type]
     * 取得特定類型的首頁內容
     */
    async GET(
      request: NextRequest,
      { params }: { params: Promise<{ type: string }> }
    ) {
      try {
        const { type } = await params;

        // 驗證類型
        const validTypes = ['hero', 'about', 'services', 'features', 'cta'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { error: 'INVALID_TYPE', message: '不支援的內容類型' },
            { status: 400 }
          );
        }

        const content = await dataSource.getHomeContentByType(type as keyof HomeContent);

        if (!content) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: '內容不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({ content }, { status: 200 });
      } catch (error) {
        console.error('Get home content by type error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得首頁內容' },
          { status: 500 }
        );
      }
    },

    /**
     * PUT /api/admin/home-content/[type]
     * 更新特定類型的首頁內容
     */
    async PUT(
      request: NextRequest,
      { params }: { params: Promise<{ type: string }> }
    ) {
      try {
        // 驗證身份
        const authenticated = await authCheck();
        if (!authenticated) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: '未授權' },
            { status: 401 }
          );
        }

        const { type } = await params;

        // 驗證類型
        const validTypes = ['hero', 'about', 'services', 'features', 'cta'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { error: 'INVALID_TYPE', message: '不支援的內容類型' },
            { status: 400 }
          );
        }

        const data = await request.json();

        const success = await dataSource.updateHomeContentByType(
          type as keyof HomeContent,
          data
        );

        if (!success) {
          return NextResponse.json(
            { error: 'UPDATE_FAILED', message: '更新首頁內容失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '首頁內容更新成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Update home content error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法更新首頁內容' },
          { status: 500 }
        );
      }
    }
  };
}
