import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB (Vercel body limit is 4.5MB)

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權的請求' }, { status: 401 });
  }

  try {
    const { fileName, totalSize } = await request.json();

    if (!fileName || !totalSize) {
      return NextResponse.json(
        { error: '缺少必要參數：fileName, totalSize' },
        { status: 400 }
      );
    }

    // 計算分塊數量
    const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

    // 獲取用戶 ID（使用 email 作為標識）
    const userId = session.user.email;

    // 建立上傳 session
    const uploadSession = await prisma.uploadSession.create({
      data: {
        fileName,
        totalSize,
        chunkSize: CHUNK_SIZE,
        totalChunks,
        uploadedChunks: [],
        tempPath: `uploads/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小時後過期
      },
    });

    return NextResponse.json({
      uploadId: uploadSession.id,
      chunkSize: CHUNK_SIZE,
      totalChunks,
      totalSize,
    });
  } catch (error) {
    console.error('上傳初始化失敗:', error);
    return NextResponse.json(
      { error: '上傳初始化失敗' },
      { status: 500 }
    );
  }
}
