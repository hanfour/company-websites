import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

const storage = getStorage();

// 獲取單個專案
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    
    const project = await storage.project.findUnique(id);
    
    if (!project) {
      return NextResponse.json(
        { error: '專案不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('獲取專案失敗:', error);
    return NextResponse.json(
      { error: '獲取專案失敗' },
      { status: 500 }
    );
  }
}

// 更新專案
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 檢查管理員身份
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const id = params.id;
    const body = await request.json();
    const { title, description, category, images, details, order, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少專案 ID' }, { status: 400 });
    }

    // 1. 更新專案基本資料
    const updatedProject = await storage.project.update(id, {
      title,
      description,
      category,
      details,
      order,
      isActive,
    });

    // 2. 處理圖片更新
    if (images && Array.isArray(images)) {
      const existingImages = await storage.projectImage.findByProject(id);

      const existingImageUrls = existingImages.map(img => img.imageUrl);
      const newImageUrls = images.map((img: { imageUrl: string }) => img.imageUrl);

      // 找出要刪除的圖片
      const imagesToDelete = existingImages.filter(
        img => !newImageUrls.includes(img.imageUrl)
      );

      // 找出要新增的圖片
      const imagesToAdd = images.filter(
        (img: { imageUrl: string }) => !existingImageUrls.includes(img.imageUrl)
      );

      // 找出要更新的圖片 (順序可能改變)
      const imagesToUpdate = images.filter(
        (img: { id?: string, imageUrl: string }) => existingImageUrls.includes(img.imageUrl)
      );

      // 執行刪除
      for (const img of imagesToDelete) {
        await storage.projectImage.delete(img.id);
      }

      // 執行新增
      for (const img of imagesToAdd) {
        await storage.projectImage.create({
          imageUrl: img.imageUrl,
          order: img.order,
          projectId: id,
        });
      }

      // 執行更新
      for (const img of imagesToUpdate) {
        const existing = existingImages.find(e => e.imageUrl === img.imageUrl);
        if (existing) {
          await storage.projectImage.update(existing.id, {
            order: img.order,
          });
        }
      }
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('更新專案失敗:', error);
    return NextResponse.json(
      { error: '更新專案失敗' },
      { status: 500 }
    );
  }
}

// 刪除專案
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 檢查管理員身份
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授權' }, { status: 401 });
    }

    const id = params.id;
    
    // 檢查專案是否存在
    const existingProject = await storage.project.findUnique(id);

    if (!existingProject) {
      return NextResponse.json(
        { error: '專案不存在' },
        { status: 404 }
      );
    }

    // 如果專案有關聯的文檔，則起用 Document 的 projectId
    const documents = await storage.document.findByProject(id);
    for (const doc of documents) {
      await storage.document.update(doc.id, { projectId: null });
    }

    // 刪除專案 (Storage layer should cascade delete images)
    await storage.project.delete(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除專案失敗:', error);
    return NextResponse.json(
      { error: '刪除專案失敗' },
      { status: 500 }
    );
  }
}
