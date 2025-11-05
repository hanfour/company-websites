import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { updateCarouselItem, deleteCarouselItem } from '@/lib/data/db';
import type { CarouselItem } from '@/types';

// PUT - 更新輪播圖
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ index: string }> }
) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { index: indexParam } = await params;
    const index = parseInt(indexParam);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: 'INVALID_INDEX' }, { status: 400 });
    }

    // 獲取請求數據
    const data: CarouselItem = await request.json();

    // 驗證必要欄位
    if (!data.name || !data.src || !data.location) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // 更新輪播圖
    const success = await updateCarouselItem(index, data);
    if (!success) {
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Update carousel item error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// DELETE - 刪除輪播圖
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ index: string }> }
) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { index: indexParam } = await params;
    const index = parseInt(indexParam);
    if (isNaN(index) || index < 0) {
      return NextResponse.json({ error: 'INVALID_INDEX' }, { status: 400 });
    }

    // 刪除輪播圖
    const success = await deleteCarouselItem(index);
    if (!success) {
      return NextResponse.json({ error: 'DELETE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Delete carousel item error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
