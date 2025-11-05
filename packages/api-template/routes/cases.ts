import { NextRequest, NextResponse } from 'next/server';
import type { CaseItem } from '@repo/types';

/**
 * 資料來源介面
 * 每個專案需要實作這個介面來提供自己的資料存取邏輯
 */
export interface CasesDataSource {
  getCases(): Promise<CaseItem[]>;
  getCaseById(id: string): Promise<CaseItem | null>;
  createCase(data: CaseItem): Promise<boolean>;
  updateCase(id: string, data: Partial<CaseItem>): Promise<boolean>;
  deleteCase(id: string): Promise<boolean>;
}

/**
 * 建立 Cases API 端點
 * @param dataSource - 資料來源實作
 * @param authCheck - 權限檢查函數
 * @returns API 端點處理函數
 */
export function createCasesAPI(
  dataSource: CasesDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/cases
     * 獲取所有建案列表
     */
    async GET() {
      try {
        const cases = await dataSource.getCases();
        return NextResponse.json({ items: cases }, { status: 200 });
      } catch (error) {
        console.error('Get cases error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    },

    /**
     * POST /api/admin/cases
     * 建立新建案
     */
    async POST(request: NextRequest) {
      try {
        // 檢查權限
        const admin = await authCheck();
        if (!admin) {
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        // 獲取請求數據
        const data: CaseItem = await request.json();

        // 驗證必要欄位
        if (!data.numberID || !data.name || !data.type) {
          return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
        }

        // 建立建案
        const success = await dataSource.createCase(data);
        if (!success) {
          return NextResponse.json({ error: 'CREATE_FAILED' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
      } catch (error) {
        console.error('Create case error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    }
  };
}

/**
 * 建立單個建案 API 端點
 * @param dataSource - 資料來源實作
 * @param authCheck - 權限檢查函數
 * @returns API 端點處理函數
 */
export function createCaseByIdAPI(
  dataSource: CasesDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/cases/[id]
     * 獲取單個建案詳情
     */
    async GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      try {
        const { id } = await params;
        const caseItem = await dataSource.getCaseById(id);

        if (!caseItem) {
          return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        }

        return NextResponse.json({ item: caseItem }, { status: 200 });
      } catch (error) {
        console.error('Get case by ID error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    },

    /**
     * PUT /api/admin/cases/[id]
     * 更新建案資訊
     */
    async PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      try {
        // 檢查權限
        const admin = await authCheck();
        if (!admin) {
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        const { id } = await params;

        // 獲取請求數據
        const data: Partial<CaseItem> = await request.json();

        // 更新建案
        const success = await dataSource.updateCase(id, data);
        if (!success) {
          return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        console.error('Update case error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    },

    /**
     * DELETE /api/admin/cases/[id]
     * 刪除建案
     */
    async DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
      try {
        // 檢查權限
        const admin = await authCheck();
        if (!admin) {
          return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
        }

        const { id } = await params;

        // 刪除建案
        const success = await dataSource.deleteCase(id);
        if (!success) {
          return NextResponse.json({ error: 'DELETE_FAILED' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
      } catch (error) {
        console.error('Delete case error:', error);
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
      }
    }
  };
}
