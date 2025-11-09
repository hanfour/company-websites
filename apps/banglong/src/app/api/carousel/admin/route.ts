import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';
import { NextResponse } from 'next/server';

const storage = getStorage();

// GET: 获取所有轮播项 (包括非活跃项) - 需要管理员权限
export async function GET() {
  try {
    // 验证管理员身份
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      );
    }
    
    // 获取所有轮播项并按顺序排序
    const carouselItems = await storage.carousel.findMany({
      orderBy: {
        field: 'order' as any,
        direction: 'asc'
      }
    });
    
    return NextResponse.json({ carouselItems });
  } catch (error) {
    console.error('Error fetching carousel items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel items' },
      { status: 500 }
    );
  }
}