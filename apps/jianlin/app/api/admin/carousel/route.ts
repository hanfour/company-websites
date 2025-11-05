import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { getCarouselItems, addCarouselItem, reorderCarouselItems } from '@/lib/data/db';
import type { CarouselItem } from '@/types';

// GET - 獲取所有輪播圖
export async function GET() {
  try {
    const items = await getCarouselItems();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Get carousel items error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// POST - 新增輪播圖
export async function POST(request: NextRequest) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 獲取請求數據
    const data: CarouselItem = await request.json();

    // 驗證必要欄位
    if (!data.name || !data.src || !data.location) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // 新增輪播圖
    const success = await addCarouselItem(data);
    if (!success) {
      return NextResponse.json({ error: 'CREATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Create carousel item error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// PUT - 重新排序輪播圖
export async function PUT(request: NextRequest) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 獲取請求數據
    const { items }: { items: CarouselItem[] } = await request.json();

    // 驗證數據
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'INVALID_DATA' }, { status: 400 });
    }

    // 重新排序
    const success = await reorderCarouselItems(items);
    if (!success) {
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Reorder carousel items error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
