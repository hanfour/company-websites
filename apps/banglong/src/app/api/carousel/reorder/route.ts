import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';
import { NextResponse } from 'next/server';

const storage = getStorage();

// POST: 调整轮播项顺序 (需要管理员权限)
export async function POST(request: Request) {
  try {
    // 验证管理员身份
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      );
    }
    
    const { id, direction } = await request.json();
    
    if (!id || !direction || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json(
        { error: '無效的請求參數' },
        { status: 400 }
      );
    }
    
    // 获取当前项
    const currentItem = await storage.carousel.findUnique(id);

    if (!currentItem) {
      return NextResponse.json(
        { error: '輪播項目不存在' },
        { status: 404 }
      );
    }

    // 获取相邻项
    const allItems = await storage.carousel.findMany({
      where: {
        order: (direction === 'up'
          ? { lt: currentItem.order }
          : { gt: currentItem.order }) as any
      },
      orderBy: {
        field: 'order' as any,
        direction: direction === 'up' ? 'desc' : 'asc'
      }
    });
    const adjacentItem = allItems[0];

    if (!adjacentItem) {
      return NextResponse.json(
        { message: '無法調整順序，已達到邊界' },
        { status: 400 }
      );
    }

    // 交换两个项目的顺序
    const tempOrder = currentItem.order;
    await storage.carousel.update(currentItem.id, { order: adjacentItem.order });
    await storage.carousel.update(adjacentItem.id, { order: tempOrder });
    
    return NextResponse.json({ message: '順序調整成功' });
  } catch (error) {
    console.error('Error reordering carousel items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder carousel items' },
      { status: 500 }
    );
  }
}