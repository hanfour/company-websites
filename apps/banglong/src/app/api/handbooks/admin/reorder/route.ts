import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();
import { getServerSession } from 'next-auth';

// 批次更新手冊排序
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {

    const { handbooks } = await request.json();

    if (!Array.isArray(handbooks)) {
      return NextResponse.json(
        { error: '無效的資料格式' },
        { status: 400 }
      );
    }

    // 批次更新
    for (const handbook of handbooks) { await storage.handbook.update(handbook.id, { order: handbook.order }); };

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新排序失敗:', error);
    return NextResponse.json(
      { error: '更新排序失敗' },
      { status: 500 }
    );
  }
}
