import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const storage = getStorage();

// 獲取後台專案列表
export async function GET(request: NextRequest) {
  try {
    // 檢查管理員身份
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;

    const where: { category?: string } = {};

    if (category) {
      where.category = category;
    }

    const projects = await storage.project.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });

    // 手動查詢關聯數據
    const projectsWithRelations = await Promise.all(
      projects.map(async (project) => {
        const documents = await storage.document.findMany({
          where: { projectId: project.id }
        });

        const images = await storage.projectImage.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        });

        return {
          ...project,
          documents,
          images
        };
      })
    );

    return NextResponse.json({ projects: projectsWithRelations });
  } catch (error) {
    console.error('獲取後台專案列表失敗:', error);
    return NextResponse.json(
      { error: '獲取後台專案列表失敗' },
      { status: 500 }
    );
  }
}

// 創建新專案
export async function POST(request: NextRequest) {
  try {
    // 檢查管理員身份
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category, images, details, isActive } = body;

    // 檢查必填字段
    if (!title || !category || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '標題、類別和至少一張圖片為必填項' },
        { status: 400 }
      );
    }

    // 獲取當前最大的order值
    const allProjects = await storage.project.findMany({
      where: { category },
      orderBy: {
        order: 'desc'
      }
    });
    const maxOrderProject = allProjects[0];

    const newOrder = maxOrderProject ? maxOrderProject.order + 1 : 1;

    // 創建新專案
    const createdProject = await storage.project.create({
      title,
      description: description || null,
      category,
      details: details || { items: [] },
      order: newOrder,
      isActive: isActive ?? true,
    });

    // 創建專案圖片
    for (const image of images) {
      await storage.projectImage.create({
        imageUrl: image.imageUrl,
        order: image.order,
        projectId: createdProject.id,
      });
    }

    return NextResponse.json({ project: createdProject }, { status: 201 });
  } catch (error) {
    console.error('創建專案失敗:', error);
    return NextResponse.json(
      { error: '創建專案失敗' },
      { status: 500 }
    );
  }
}
