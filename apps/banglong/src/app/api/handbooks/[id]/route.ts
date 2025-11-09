import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 獲取單一手冊資訊 (前台,不含密碼)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const handbook = await storage.handbook.findUnique(id);

    if (!handbook) {
      return NextResponse.json(
        { error: '手冊不存在' },
        { status: 404 }
      );
    }

    // 查詢關聯的專案
    let projectData = null;
    if (handbook.projectId) {
      const project = await storage.project.findUnique(handbook.projectId);
      if (project) {
        projectData = { id: project.id, title: project.title };
      }
    }

    // 只返回前台需要的欄位,不含密碼
    const handbookPublic = {
      id: handbook.id,
      title: handbook.title,
      coverImageUrl: handbook.coverImageUrl,
      description: handbook.description,
      order: handbook.order,
      projectId: handbook.projectId,
      project: projectData
    };

    return NextResponse.json({ handbook: handbookPublic });
  } catch (error) {
    console.error('獲取手冊失敗:', error);
    return NextResponse.json(
      { error: '獲取手冊失敗' },
      { status: 500 }
    );
  }
}
