import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 獲取文檔列表，可依據類別篩選
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const projectId = searchParams.get('projectId') || undefined;

    const where: any = {
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const documents = await storage.document.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });

    // 手動查詢關聯的 project 數據
    const documentsWithProjects = await Promise.all(
      documents.map(async (doc) => {
        if (!doc.projectId) {
          return { ...doc, project: null };
        }

        const project = await storage.project.findUnique(doc.projectId);
        if (!project) {
          return { ...doc, project: null };
        }

        // 獲取專案的第一張圖片
        const images = await storage.projectImage.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        });

        return {
          ...doc,
          project: {
            title: project.title,
            imageUrl: images.length > 0 ? images[0].imageUrl : null
          }
        };
      })
    );

    return NextResponse.json({ documents: documentsWithProjects });
  } catch (error) {
    console.error('獲取文檔失敗:', error);
    return NextResponse.json(
      { 
        error: '獲取文檔失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}