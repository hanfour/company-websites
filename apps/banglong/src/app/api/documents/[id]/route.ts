import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const storage = getStorage();

// 獲取單個文檔詳情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const document = await storage.document.findUnique(id);

    if (!document) {
      return NextResponse.json({ error: '找不到指定的文檔' }, { status: 404 });
    }

    // 檢查是否為管理員
    const session = await getServerSession(authOptions);
    const isAdmin = !!session;

    // 如果不是管理員且文檔未啟用，則拒絕訪問
    if (!isAdmin && !document.isActive) {
      return NextResponse.json({ error: '無法訪問此文檔' }, { status: 403 });
    }

    // 手動查詢關聯的 project 數據
    let projectData = null;
    if (document.projectId) {
      const project = await storage.project.findUnique(document.projectId);
      if (project) {
        // 獲取專案的第一張圖片
        const images = await storage.projectImage.findMany({
          where: { projectId: project.id },
          orderBy: { order: 'asc' }
        });

        projectData = {
          title: project.title,
          imageUrl: images.length > 0 ? images[0].imageUrl : null
        };
      }
    }

    return NextResponse.json({
      document: {
        ...document,
        project: projectData
      }
    });
  } catch (error) {
    console.error('獲取文檔詳情失敗:', error);
    return NextResponse.json(
      { 
        error: '獲取文檔詳情失敗',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// 記錄文檔下載或使用事件
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const body = await request.json();
    const { action } = body;

    if (action !== 'download' && action !== 'view') {
      return NextResponse.json({
        success: false,
        error: '無效的操作類型'
      }, { status: 400 });
    }

    // 驗證文檔是否存在
    const document = await storage.document.findUnique(id);

    if (!document) {
      return NextResponse.json({
        success: false,
        error: '找不到指定的文檔'
      }, { status: 404 });
    }

    // 記錄下載事件 (更新下載次數)
    const updatedDoc = await storage.document.update({
      where: { id },
      data: {
        downloadCount: (document.downloadCount || 0) + 1,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      action: action,
      document: {
        id: updatedDoc.id,
        downloadCount: updatedDoc.downloadCount
      }
    });
  } catch (error) {
    console.error('處理文檔下載事件失敗:', error);
    
    // 即使記錄失敗也返回成功，避免影響用戶體驗
    return NextResponse.json({
      success: true,
      warning: '下載已完成，但系統無法記錄下載事件'
    });
  }
}