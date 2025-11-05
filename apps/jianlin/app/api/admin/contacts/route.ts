import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { getContactMessages } from '@/lib/data/db';

/**
 * GET /api/admin/contacts
 * 获取所有联系表单列表
 */
export async function GET(request: NextRequest) {
  try {
    // 检查权限
    const user = await getCurrentUser();
    if (!user || user.type !== 1) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending | replied | archived

    // 获取所有联系表单
    let contacts = await getContactMessages();

    // 按状态筛选
    if (status && status !== 'all') {
      contacts = contacts.filter(c => c.status === status);
    }

    return NextResponse.json({
      success: true,
      data: contacts,
      total: contacts.length,
    });
  } catch (error) {
    console.error('[Admin Contacts] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '获取联系表单失败' },
      { status: 500 }
    );
  }
}
