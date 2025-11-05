import { NextRequest, NextResponse } from 'next/server';
import type { CarouselItem } from '@repo/types';

/**
 * Carousel 資料來源介面
 * 每個專案實作自己的資料存取邏輯（JSON 檔案、資料庫等）
 */
export interface CarouselDataSource {
  getCarouselItems(): Promise<CarouselItem[]>;
  getCarouselItemByIndex(index: number): Promise<CarouselItem | null>;
  createCarouselItem(data: CarouselItem): Promise<boolean>;
  updateCarouselItem(index: number, data: Partial<CarouselItem>): Promise<boolean>;
  deleteCarouselItem(index: number): Promise<boolean>;
  reorderCarouselItems(items: CarouselItem[]): Promise<boolean>;
}

/**
 * 建立 Carousel API
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數（用於需要權限的操作）
 * @returns API 路由處理器
 */
export function createCarouselAPI(
  dataSource: CarouselDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/carousel
     * 取得所有輪播圖片
     */
    async GET() {
      try {
        const items = await dataSource.getCarouselItems();
        return NextResponse.json({ items }, { status: 200 });
      } catch (error) {
        console.error('Get carousel error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得輪播圖片' },
          { status: 500 }
        );
      }
    },

    /**
     * POST /api/admin/carousel
     * 新增輪播圖片
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

        const data: CarouselItem = await request.json();

        // 驗證必要欄位
        if (!data.name || !data.src) {
          return NextResponse.json(
            { error: 'MISSING_FIELDS', message: '缺少必要欄位' },
            { status: 400 }
          );
        }

        const success = await dataSource.createCarouselItem(data);

        if (!success) {
          return NextResponse.json(
            { error: 'CREATE_FAILED', message: '新增輪播圖片失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '輪播圖片新增成功' },
          { status: 201 }
        );
      } catch (error) {
        console.error('Create carousel error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法新增輪播圖片' },
          { status: 500 }
        );
      }
    },

    /**
     * PUT /api/admin/carousel
     * 重新排序所有輪播圖片
     */
    async PUT(request: NextRequest) {
      try {
        // 驗證身份
        const authenticated = await authCheck();
        if (!authenticated) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: '未授權' },
            { status: 401 }
          );
        }

        const { items }: { items: CarouselItem[] } = await request.json();

        if (!Array.isArray(items)) {
          return NextResponse.json(
            { error: 'INVALID_DATA', message: '資料格式錯誤' },
            { status: 400 }
          );
        }

        const success = await dataSource.reorderCarouselItems(items);

        if (!success) {
          return NextResponse.json(
            { error: 'REORDER_FAILED', message: '重新排序失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '輪播圖片順序更新成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Reorder carousel error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法重新排序輪播圖片' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * 建立單一 Carousel API（by index）
 * @param dataSource - 資料來源實作
 * @param authCheck - 身份驗證函數
 * @returns API 路由處理器
 */
export function createCarouselByIndexAPI(
  dataSource: CarouselDataSource,
  authCheck: () => Promise<boolean>
) {
  return {
    /**
     * GET /api/admin/carousel/[index]
     * 取得單一輪播圖片
     */
    async GET(
      request: NextRequest,
      { params }: { params: Promise<{ index: string }> }
    ) {
      try {
        const { index } = await params;
        const indexNum = parseInt(index, 10);

        if (isNaN(indexNum) || indexNum < 0) {
          return NextResponse.json(
            { error: 'INVALID_INDEX', message: '索引格式錯誤' },
            { status: 400 }
          );
        }

        const item = await dataSource.getCarouselItemByIndex(indexNum);

        if (!item) {
          return NextResponse.json(
            { error: 'NOT_FOUND', message: '輪播圖片不存在' },
            { status: 404 }
          );
        }

        return NextResponse.json({ item }, { status: 200 });
      } catch (error) {
        console.error('Get carousel item error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法取得輪播圖片' },
          { status: 500 }
        );
      }
    },

    /**
     * PUT /api/admin/carousel/[index]
     * 更新單一輪播圖片
     */
    async PUT(
      request: NextRequest,
      { params }: { params: Promise<{ index: string }> }
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

        const { index } = await params;
        const indexNum = parseInt(index, 10);

        if (isNaN(indexNum) || indexNum < 0) {
          return NextResponse.json(
            { error: 'INVALID_INDEX', message: '索引格式錯誤' },
            { status: 400 }
          );
        }

        const data: Partial<CarouselItem> = await request.json();

        const success = await dataSource.updateCarouselItem(indexNum, data);

        if (!success) {
          return NextResponse.json(
            { error: 'UPDATE_FAILED', message: '更新輪播圖片失敗' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '輪播圖片更新成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Update carousel item error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法更新輪播圖片' },
          { status: 500 }
        );
      }
    },

    /**
     * DELETE /api/admin/carousel/[index]
     * 刪除輪播圖片
     */
    async DELETE(
      request: NextRequest,
      { params }: { params: Promise<{ index: string }> }
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

        const { index } = await params;
        const indexNum = parseInt(index, 10);

        if (isNaN(indexNum) || indexNum < 0) {
          return NextResponse.json(
            { error: 'INVALID_INDEX', message: '索引格式錯誤' },
            { status: 400 }
          );
        }

        const success = await dataSource.deleteCarouselItem(indexNum);

        if (!success) {
          return NextResponse.json(
            { error: 'DELETE_FAILED', message: '刪除輪播圖片失敗' },
            { status: 404 }
          );
        }

        return NextResponse.json(
          { success: true, message: '輪播圖片刪除成功' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Delete carousel item error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '無法刪除輪播圖片' },
          { status: 500 }
        );
      }
    }
  };
}
