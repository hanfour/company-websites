import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 獲取專案列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    
    const where: { isActive: boolean, category?: string } = {
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    const projects = await storage.project.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });

    // 手動查詢關聯的 images 數據
    const projectsWithImages = await Promise.all(
      projects.map(async (project) => {
        const images = await storage.projectImage.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        });

        return {
          ...project,
          images
        };
      })
    );

    return NextResponse.json({ projects: projectsWithImages });
  } catch (error) {
    console.error('獲取專案列表失敗:', error);
    return NextResponse.json(
      { error: '獲取專案列表失敗' },
      { status: 500 }
    );
  }
}