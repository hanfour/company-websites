import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';

const storage = getStorage();

// 記錄文件下載次數
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { fileId } = await params;

    // 先獲取當前檔案
    const file = await storage.handbookFile.findUnique(fileId);
    if (!file) {
      return NextResponse.json(
        { success: false, error: '檔案不存在' },
        { status: 404 }
      );
    }

    // 更新下載次數
    await storage.handbookFile.update(fileId, {
      downloadCount: (file.downloadCount || 0) + 1
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('記錄下載次數失敗:', error);
    return NextResponse.json(
      { success: false, error: '記錄下載次數失敗' },
      { status: 500 }
    );
  }
}
