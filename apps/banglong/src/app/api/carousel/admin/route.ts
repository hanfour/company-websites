import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helper';

const storage = getStorage();

// GET: 获取所有轮播项 (包括非活跃项) - 需要管理员权限
export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    
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