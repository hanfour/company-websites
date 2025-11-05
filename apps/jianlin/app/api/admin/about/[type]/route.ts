import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { updateAboutItem } from '@/lib/data/db';
import type { AboutItem } from '@/types';

// PUT - 更新關於建林內容
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { type: typeParam } = await params;
    const type = typeParam as 'item_1' | 'item_2' | 'item_3' | 'item_4';
    if (!['item_1', 'item_2', 'item_3', 'item_4'].includes(type)) {
      return NextResponse.json({ error: 'INVALID_TYPE' }, { status: 400 });
    }

    // 獲取請求數據
    const data: Partial<AboutItem> = await request.json();

    // 驗證必要欄位
    if (!data.title || !data.src) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // 更新內容
    const success = await updateAboutItem(type, data as AboutItem);
    if (!success) {
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Update about item error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
