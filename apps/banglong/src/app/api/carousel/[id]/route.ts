import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getStorage } from '@/lib/storage';
import { NextResponse } from 'next/server';

const storage = getStorage();

// GET: 获取单个轮播项
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const carouselItem = await storage.carousel.findUnique(params.id);

    if (!carouselItem) {
      return NextResponse.json(
        { error: '輪播項目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ carouselItem });
  } catch (error) {
    console.error('Error fetching carousel item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch carousel item' },
      { status: 500 }
    );
  }
}

// PATCH: 更新轮播项 (需要管理员权限)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员身份
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      );
    }
    
    const data = await request.json();

    // 更新轮播项
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.linkText !== undefined) updateData.linkText = data.linkText;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.textPosition !== undefined) updateData.textPosition = data.textPosition;
    if (data.textDirection !== undefined) updateData.textDirection = data.textDirection;

    const updatedCarousel = await storage.carousel.update(params.id, updateData);
    
    return NextResponse.json({ carousel: updatedCarousel });
  } catch (error) {
    console.error('Error updating carousel item:', error);
    return NextResponse.json(
      { error: 'Failed to update carousel item' },
      { status: 500 }
    );
  }
}

// DELETE: 删除轮播项 (需要管理员权限)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员身份
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: '未授權的請求' },
        { status: 401 }
      );
    }
    
    // 删除轮播项
    await storage.carousel.delete(params.id);
    
    return NextResponse.json(
      { message: '輪播項目已成功刪除' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting carousel item:', error);
    return NextResponse.json(
      { error: 'Failed to delete carousel item' },
      { status: 500 }
    );
  }
}