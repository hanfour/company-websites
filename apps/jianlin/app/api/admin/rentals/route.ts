import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { createRental } from '@/lib/data/db';
import type { RentalItem } from '@/types';

// POST - 建立新租售物件
export async function POST(request: NextRequest) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 獲取請求數據
    const data: RentalItem = await request.json();

    // 驗證必要欄位
    if (!data.numberID || !data.name) {
      return NextResponse.json({ error: 'MISSING_FIELDS' }, { status: 400 });
    }

    // 建立租售物件
    const success = await createRental(data);
    if (!success) {
      return NextResponse.json({ error: 'CREATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Create rental error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
