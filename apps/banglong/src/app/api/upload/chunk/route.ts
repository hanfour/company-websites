import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { put } from '@vercel/blob';

export const maxDuration = 120;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權的請求' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const uploadId = formData.get('uploadId') as string;
    const chunkIndex = formData.get('chunkIndex') as string;
    const chunk = formData.get('chunk') as File;

    if (!uploadId || chunkIndex === null || !chunk) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 驗證上傳 session 是否存在
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: uploadId },
    });

    if (!uploadSession) {
      return NextResponse.json(
        { error: '上傳 session 不存在' },
        { status: 404 }
      );
    }

    // 驗證 session 是否過期
    if (uploadSession.expiresAt < new Date()) {
      return NextResponse.json(
        { error: '上傳 session 已過期' },
        { status: 410 }
      );
    }

    // 驗證 chunkIndex 有效性
    const chunkIdx = parseInt(chunkIndex, 10);
    if (chunkIdx < 0 || chunkIdx >= uploadSession.totalChunks) {
      return NextResponse.json(
        { error: '無效的分塊索引' },
        { status: 400 }
      );
    }

    // 檢查該分塊是否已上傳
    const uploadedChunks = uploadSession.uploadedChunks as string[];
    const chunkUrls = (uploadSession.chunkUrls as Record<string, string>) || {};

    if (uploadedChunks.includes(chunkIndex)) {
      return NextResponse.json(
        {
          message: '分塊已存在',
          uploadId,
          chunkIndex: chunkIdx,
          uploadedChunks: uploadedChunks.length,
          totalChunks: uploadSession.totalChunks,
        },
        { status: 200 }
      );
    }

    // 上傳 chunk 到 Vercel Blob
    const chunkPath = `${uploadSession.tempPath}/chunk-${chunkIdx}`;
    const blob = await put(chunkPath, chunk, {
      access: 'public',
    });

    // 更新已上傳分塊列表和 URL 映射
    const newUploadedChunks = [...uploadedChunks, chunkIndex];
    const newChunkUrls = {
      ...chunkUrls,
      [chunkIndex]: blob.url,
    };

    await prisma.uploadSession.update({
      where: { id: uploadId },
      data: {
        uploadedChunks: newUploadedChunks,
        chunkUrls: newChunkUrls,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: '分塊上傳成功',
      uploadId,
      chunkIndex: chunkIdx,
      chunkUrl: blob.url,
      uploadedChunks: newUploadedChunks.length,
      totalChunks: uploadSession.totalChunks,
    });
  } catch (error) {
    console.error('分塊上傳失敗:', error);
    return NextResponse.json(
      { error: '分塊上傳失敗' },
      { status: 500 }
    );
  }
}
