import { NextRequest, NextResponse } from 'next/server';
import type { AboutContent } from '@repo/types';

/**
 * About 資料來源介面
 * 每個專案實作自己的資料存取邏輯（JSON 檔案、資料庫等）
 */
export interface AboutDataSource {
  getAboutContent(): Promise<AboutContent>;
  getAboutContentByType(type: keyof AboutContent): Promise<any>;
  updateAboutContentByType(type: keyof AboutContent, data: any): Promise<boolean>;
}

/**
 * 建立 About API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數（用於需要權限的操作）
 * @returns API 路由處理器
 */
export function createAboutAPI(
  dataSource: AboutDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/about
     * 取得所有關於我們的內容
     */
    async GET() {
      try {
        const content = await dataSource.getAboutContent();
        return NextResponse.json({ content }, { status: 200 });
      } catch (error) {
        console.error('Get about content error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得關於我們的內容' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * 建立 About by Type API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數
 * @returns API 路由處理器
 */
export function createAboutByTypeAPI(
  dataSource: AboutDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/about/[type]
     * 取得特定類型的關於我們內容
     */
    async GET(
      request: NextRequest,
      { params }: { params: Promise<{ type: string }> }
    ) {
      try {
        const { type } = await params;

        // 驗證類型
        const validTypes = ['company', 'history', 'team', 'values', 'certifications'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { error: 'INVALID_TYPE', message: '不支援的內容類型' },
            { status: 400 }
          );
        }

        const content = await dataSource.getAboutContentByType(type as keyof AboutContent);

        if (!content) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: '內容不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({ content }, { status: 200 });
      } catch (error) {
        console.error('Get about content by type error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得關於我們的內容' },
          { status: 500 }
        );
      }
    },

    /**
     * PUT /api/admin/about/[type]
     * 更新特定類型的關於我們內容
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
        const validTypes = ['company', 'history', 'team', 'values', 'certifications'];
        if (!validTypes.includes(type)) {
          return NextResponse.json(
            { error: 'INVALID_TYPE', message: '不支援的內容類型' },
            { status: 400 }
          );
        }

        const data = await request.json();

        const success = await dataSource.updateAboutContentByType(
          type as keyof AboutContent,
          data
        );

        if (!success) {
          return NextResponse.json(
            { error: 'UPDATE_FAILED', message: '更新關於我們內容失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '關於我們內容更新成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Update about content error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法更新關於我們的內容' },
          { status: 500 }
        );
      }
    }
  };
}
