import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 獲取所有啟用的手冊列表 (前台,不含密碼)
export async function GET(request: NextRequest) {
  try {
    const handbooks = await storage.handbook.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    // 手動查詢關聯數據並排除密碼
    const handbooksPublic = await Promise.all(
      handbooks.map(async (handbook) => {
        // 查詢關聯的專案
        let projectData = null;
        if (handbook.projectId) {
          const project = await storage.project.findUnique(handbook.projectId);
          if (project) {
            projectData = { id: project.id, title: project.title };
          }
        }

        // 只返回前台需要的欄位,不含密碼
        return {
          id: handbook.id,
          title: handbook.title,
          coverImageUrl: handbook.coverImageUrl,
          description: handbook.description,
          order: handbook.order,
          projectId: handbook.projectId,
          project: projectData
        };
      })
    );

    return NextResponse.json({ handbooks: handbooksPublic });
  } catch (error) {
    console.error('獲取手冊列表失敗:', error);
    return NextResponse.json(
      { error: '獲取手冊列表失敗' },
      { status: 500 }
    );
  }
}
