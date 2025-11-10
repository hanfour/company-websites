import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();
import { getServerSession } from 'next-auth';

// 更新文件資訊
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { fileId } = await params;

    const data = await request.json();
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.order !== undefined) updateData.order = data.order;

    const file = await storage.handbookFile.update({
      where: { id: fileId },
      data: updateData,
    });

    return NextResponse.json({ file });
  } catch (error) {
    console.error('更新文件失敗:', error);
    return NextResponse.json(
      { error: '更新文件失敗' },
      { status: 500 }
    );
  }
}

// 刪除文件
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { fileId } = await params;

    await storage.handbookFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除文件失敗:', error);
    return NextResponse.json(
      { error: '刪除文件失敗' },
      { status: 500 }
    );
  }
}
