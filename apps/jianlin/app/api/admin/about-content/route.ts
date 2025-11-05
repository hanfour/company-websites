import { NextRequest, NextResponse } from 'next/server';
import { updateCompany } from '@/lib/data/db';
import { getCurrentUser } from '@/lib/auth/auth';
import type { AboutItem } from '@/types';

// PUT - 更新所有關於建林內容區塊
export async function PUT(request: NextRequest) {
  try {
    // 驗證用戶
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { about } = body;

    if (!Array.isArray(about)) {
      return NextResponse.json({ error: 'INVALID_DATA' }, { status: 400 });
    }

    // 更新 company.json 中的 about 欄位
    const success = await updateCompany({ about: about as AboutItem[] });

    if (!success) {
      return NextResponse.json({ error: 'UPDATE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ message: 'SUCCESS' }, { status: 200 });
  } catch (error) {
    console.error('Update about content error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
