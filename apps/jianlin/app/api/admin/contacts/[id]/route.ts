import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { getContactMessageById, updateContactMessage, deleteContactMessage } from '@/lib/data/db';

/**
 * GET /api/admin/contacts/[id]
 * 获取单个联系表单详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    const user = await getCurrentUser();
    if (!user || user.type !== 1) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const contact = await getContactMessageById(id);

    if (!contact) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: '联系表单不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error('[Admin Contact Detail] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取详情失败' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/contacts/[id]
 * 更新联系表单 (状态、回复等)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    const user = await getCurrentUser();
    if (!user || user.type !== 1) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // 如果更新为已回复状态,记录回复时间和回复人
    if (updates.status === 'replied' && updates.adminReply) {
      updates.repliedAt = new Date().toISOString();
      updates.repliedBy = user.account;
    }

    const success = await updateContactMessage(id, updates);

    if (!success) {
      return NextResponse.json(
        { error: 'UPDATE_FAILED', message: '更新失败' },
        { status: 500 }
      );
    }

    // 返回更新后的数据
    const updated = await getContactMessageById(id);

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('[Admin Contact Update] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '更新失败' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/contacts/[id]
 * 删除联系表单
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 检查权限
    const user = await getCurrentUser();
    if (!user || user.type !== 1) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { id } = await params;
    const success = await deleteContactMessage(id);

    if (!success) {
      return NextResponse.json(
        { error: 'DELETE_FAILED', message: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '删除成功',
    });
  } catch (error) {
    console.error('[Admin Contact Delete] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '删除失败' },
      { status: 500 }
    );
  }
}
