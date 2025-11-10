import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from '@/lib/storage';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();
import { getServerSession } from 'next-auth';
import bcrypt from 'bcrypt';

// 更新手冊
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    const data = await request.json();
    const updateData: any = {};

    // 可更新的欄位
    if (data.title !== undefined) updateData.title = data.title;
    if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.projectId !== undefined) updateData.projectId = data.projectId || null;

    // 如果有新密碼,重新加密
    if (data.password && data.password.trim() !== '') {
      // 驗證密碼長度
      if (data.password.length < 6 || data.password.length > 8) {
        return NextResponse.json(
          { error: '密碼長度必須為 6-8 位' },
          { status: 400 }
        );
      }
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const handbook = await storage.handbook.update(id, updateData);

    // 手動查詢關聯的 project 數據
    let projectData = null;
    if (handbook.projectId) {
      const project = await storage.project.findUnique(handbook.projectId);
      if (project) {
        projectData = { id: project.id, title: project.title };
      }
    }

    return NextResponse.json({
      handbook: {
        ...handbook,
        project: projectData
      }
    });
  } catch (error) {
    console.error('更新手冊失敗:', error);
    return NextResponse.json(
      { error: '更新手冊失敗' },
      { status: 500 }
    );
  }
}

// 刪除手冊
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const { id } = await params;

    // 刪除手冊 (會自動 cascade 刪除關聯的 HandbookFile)
    await storage.handbook.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除手冊失敗:', error);
    return NextResponse.json(
      { error: '刪除手冊失敗' },
      { status: 500 }
    );
  }
}
