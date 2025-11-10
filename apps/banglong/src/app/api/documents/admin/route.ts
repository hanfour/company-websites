import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();

// 獲取所有文檔列表（管理員用）
export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    const projectId = searchParams.get('projectId') || undefined;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (projectId) {
      where.projectId = projectId;
    }

    const documents = await storage.document.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
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
            images: images.length > 0 ? [{ imageUrl: images[0].imageUrl }] : []
          }
        };
      })
    );

    return NextResponse.json({ documents: documentsWithProjects });
  } catch (error) {
    console.error('獲取文檔列表失敗:', error);
    return NextResponse.json(
      { error: '獲取文檔列表失敗', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 新增文檔
export async function POST(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {

    const body = await request.json();
    const { title, description, fileUrl, imageUrl, fileType, category, projectId, isActive } = body;

    // 驗證必填欄位
    if (!title || !fileUrl || !fileType || !category) {
      return NextResponse.json(
        { error: '標題、檔案URL、檔案類型和類別為必填欄位' },
        { status: 400 }
      );
    }

    // 如果有專案ID，驗證專案是否存在
    if (projectId) {
      const project = await storage.project.findUnique(projectId);
      if (!project) {
        return NextResponse.json({ error: '關聯的專案不存在' }, { status: 400 });
      }
    }

    // 確定最大順序值
    const allDocs = await storage.document.findMany({
      where: { category },
      orderBy: { order: 'desc' }
    });
    const maxOrderDoc = allDocs[0];
    const newOrder = maxOrderDoc ? maxOrderDoc.order + 1 : 1;

    // 創建新文檔
    const newDocument = await storage.document.create({
      title,
      description: description || null,
      fileUrl,
      imageUrl: imageUrl || null,
      fileType,
      category,
      order: newOrder,
      isActive: isActive !== undefined ? isActive : true,
      projectId: projectId || null
    });

    return NextResponse.json({
      document: newDocument,
      message: '文檔創建成功'
    }, { status: 201 });
  } catch (error) {
    console.error('創建文檔失敗:', error);
    return NextResponse.json(
      {
        error: '創建文檔失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 更新文檔
export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {

    const body = await request.json();
    const { id, title, description, fileUrl, imageUrl, fileType, category, projectId, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少文檔ID' }, { status: 400 });
    }

    // 檢查文檔是否存在
    const existingDocument = await storage.document.findUnique(id);
    if (!existingDocument) {
      return NextResponse.json({ error: '找不到指定的文檔' }, { status: 404 });
    }

    // 如果要更新專案關聯，先驗證專案是否存在
    if (projectId !== undefined && projectId) {
      const project = await storage.project.findUnique(projectId);
      if (!project) {
        return NextResponse.json({ error: '關聯的專案不存在' }, { status: 400 });
      }
    }

    // 準備更新資料
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (fileType !== undefined) updateData.fileType = fileType;
    if (category !== undefined) updateData.category = category;
    if (order !== undefined) updateData.order = order;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (projectId !== undefined) updateData.projectId = projectId || null;

    // 更新文檔
    const updatedDocument = await storage.document.update({
      where: { id },
      data: updateData
    });

    // 手動查詢關聯的 project 數據
    let projectData = null;
    if (updatedDocument.projectId) {
      const project = await storage.project.findUnique(updatedDocument.projectId);
      if (project) {
        const images = await storage.projectImage.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        });

        projectData = {
          title: project.title,
          images: images.length > 0 ? [{ imageUrl: images[0].imageUrl }] : []
        };
      }
    }

    return NextResponse.json({
      document: {
        ...updatedDocument,
        project: projectData
      },
      message: '文檔更新成功'
    });
  } catch (error) {
    console.error('更新文檔失敗:', error);
    return NextResponse.json(
      {
        error: '更新文檔失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 刪除文檔
export async function DELETE(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少文檔ID' }, { status: 400 });
    }

    // 檢查文檔是否存在
    const existingDocument = await storage.document.findUnique(id);
    if (!existingDocument) {
      return NextResponse.json({ error: '找不到指定的文檔' }, { status: 404 });
    }

    // 刪除文檔
    await storage.document.delete({ where: { id } });

    return NextResponse.json({ message: '文檔刪除成功' });
  } catch (error) {
    console.error('刪除文檔失敗 (外層):', error);
    return NextResponse.json(
      { 
        error: '刪除文檔失敗', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}