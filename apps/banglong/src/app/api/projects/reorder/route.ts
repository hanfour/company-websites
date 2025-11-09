import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const storage = getStorage();

// 重新排序專案
export async function POST(request: NextRequest) {
  try {
    // 檢查管理員身份
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await request.json();
    const { items, category } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '無效的排序資料' },
        { status: 400 }
      );
    }

    // 更新每個項目的順序
    for (let index = 0; index < items.length; index++) {
      await storage.project.update(items[index].id, {
        order: index + 1
      });
    }

    // 取得更新後的專案列表
    const updatedProjects = await storage.project.findMany({
      where: { category },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({ success: true, projects: updatedProjects });
  } catch (error) {
    console.error('重新排序專案失敗:', error);
    return NextResponse.json(
      { error: '重新排序專案失敗' },
      { status: 500 }
    );
  }
}
