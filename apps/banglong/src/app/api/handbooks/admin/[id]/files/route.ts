import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();
import { getServerSession } from 'next-auth';

// 上傳新文件到手冊
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    const data = await request.json();

    // 驗證必填欄位
    if (!data.title || !data.fileUrl || !data.fileType) {
      return NextResponse.json(
        { error: '標題、文件URL、文件類型為必填欄位' },
        { status: 400 }
      );
    }

    // 建立文件記錄
    const file = await storage.handbookFile.create({
      handbookId: id,
      title: data.title,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize || null,
      order: data.order || 0
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error('上傳文件失敗:', error);
    return NextResponse.json(
      { error: '上傳文件失敗' },
      { status: 500 }
    );
  }
}
