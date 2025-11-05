import { NextRequest, NextResponse } from 'next/server';
import type { RentalItem } from '@repo/types';

/**
 * Rentals 資料來源介面
 * 每個專案實作自己的資料存取邏輯（JSON 檔案、資料庫等）
 */
export interface RentalsDataSource {
  getRentals(): Promise<RentalItem[]>;
  getRentalById(id: string): Promise<RentalItem | null>;
  createRental(data: RentalItem): Promise<boolean>;
  updateRental(id: string, data: Partial<RentalItem>): Promise<boolean>;
  deleteRental(id: string): Promise<boolean>;
}

/**
 * 建立 Rentals API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數（用於需要權限的操作）
 * @returns API 路由處理器
 */
export function createRentalsAPI(
  dataSource: RentalsDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/rentals
     * 取得所有租售物件列表
     */
    async GET() {
      try {
        const rentals = await dataSource.getRentals();
        return NextResponse.json({ items: rentals }, { status: 200 });
      } catch (error) {
        console.error('Get rentals error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得租售列表' },
          { status: 500 }
        );
      }
    },

    /**
     * POST /api/admin/rentals
     * 新增租售物件
     */
    async POST(request: NextRequest) {
      try {
        // 驗證身份
        const authenticated = await authCheck();
        if (!authenticated) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: '未授權' },
            { status: 401 }
          );
        }

        const data: RentalItem = await request.json();

        // 驗證必要欄位
        if (!data.numberID || !data.title || !data.type) {
          return NextResponse.json(
            { error: 'MISSING_FIELDS', message: '缺少必要欄位' },
            { status: 400 }
          );
        }

        const success = await dataSource.createRental(data);

        if (!success) {
          return NextResponse.json(
            { error: 'CREATE_FAILED', message: '新增租售物件失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '租售物件新增成功' },
          { status: 201 }
        );
      } catch (error) {
        console.error('Create rental error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法新增租售物件' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * 建立單一 Rental API（by ID）
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數
 * @returns API 路由處理器
 */
export function createRentalByIdAPI(
  dataSource: RentalsDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/rentals/[id]
     * 取得單一租售物件
     */
    async GET(
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
    ) {
      try {
        const { id } = await params;
        const rental = await dataSource.getRentalById(id);

        if (!rental) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: '租售物件不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({ item: rental }, { status: 200 });
      } catch (error) {
        console.error('Get rental error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得租售物件' },
          { status: 500 }
        );
      }
    },

    /**
     * PUT /api/admin/rentals/[id]
     * 更新租售物件
     */
    async PUT(
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;
        const data: Partial<RentalItem> = await request.json();

        const success = await dataSource.updateRental(id, data);

        if (!success) {
          return NextResponse.json(
            { error: 'UPDATE_FAILED', message: '更新租售物件失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '租售物件更新成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Update rental error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法更新租售物件' },
          { status: 500 }
        );
      }
    },

    /**
     * DELETE /api/admin/rentals/[id]
     * 刪除租售物件
     */
    async DELETE(
      request: NextRequest,
      { params }: { params: Promise<{ id: string }> }
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

        const { id } = await params;
        const success = await dataSource.deleteRental(id);

        if (!success) {
          return NextResponse.json(
            { error: 'DELETE_FAILED', message: '刪除租售物件失敗' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { success: true, message: '租售物件刪除成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Delete rental error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法刪除租售物件' },
          { status: 500 }
        );
      }
    }
  };
}
