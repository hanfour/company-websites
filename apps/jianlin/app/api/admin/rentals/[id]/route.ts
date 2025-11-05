import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { updateRental } from '@/lib/data/db';
import type { RentalItem } from '@/types';

// PUT - 更新租售物件
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;

    // 獲取請求數據
    const data: Partial<RentalItem> = await request.json();

    // 更新租售物件
    const success = await updateRental(id, data);
    if (!success) {
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update rental error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
