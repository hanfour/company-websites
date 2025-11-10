import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 獲取手冊的文件列表
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // 驗證手冊是否存在
    const handbook = await storage.handbook.findUnique(id);

    if (!handbook) {
      return NextResponse.json(
        { error: '手冊不存在' },
        { status: 404 }
      );
    }

    // 獲取文件列表
    const files = await storage.handbookFile.findMany({
      where: { handbookId: id },
      orderBy: { field: 'order', direction: 'asc' },
    });

    return NextResponse.json({ files });
  } catch (error) {
    console.error('獲取文件列表失敗:', error);
    return NextResponse.json(
      { error: '獲取文件列表失敗' },
      { status: 500 }
    );
  }
}
