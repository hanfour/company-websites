import { NextResponse } from 'next/server';
import { getHomeContent, updateHomeContent } from '@/lib/data/db';
import { getCurrentUser } from '@/lib/auth/auth';

// GET - 獲取首頁內容區塊
export async function GET() {
  try {
    const items = await getHomeContent();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Get home content error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}

// PUT - 更新所有首頁內容區塊（用於排序和批量更新）
export async function PUT(request: Request) {
  try {
    // 驗證用戶權限
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { home } = body;

    if (!Array.isArray(home)) {
      return NextResponse.json({ error: 'INVALID_DATA' }, { status: 400 });
    }

    // 更新首頁內容
    await updateHomeContent(home);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Update home content error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
