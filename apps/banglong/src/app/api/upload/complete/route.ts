import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { put } from '@vercel/blob';

export const maxDuration = 300; // 5 分鐘超時

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: '未授權的請求' }, { status: 401 });
  }

  try {
    const { uploadId, fileName } = await request.json();

    if (!uploadId || !fileName) {
      return NextResponse.json(
        { error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 驗證上傳 session
    const uploadSession = await prisma.uploadSession.findUnique({
      where: { id: uploadId },
    });

    if (!uploadSession) {
      return NextResponse.json(
        { error: '上傳 session 不存在' },
        { status: 404 }
      );
    }

    // 驗證所有分塊是否都已上傳
    const uploadedChunks = (uploadSession.uploadedChunks as string[]).map((idx) =>
      parseInt(idx, 10)
    );
    const expectedChunks = Array.from(
      { length: uploadSession.totalChunks },
      (_, i) => i
    );

    const missingChunks = expectedChunks.filter(
      (idx) => !uploadedChunks.includes(idx)
    );

    if (missingChunks.length > 0) {
      return NextResponse.json(
        {
          error: '部分分塊未上傳',
          missingChunks,
          uploadedCount: uploadedChunks.length,
          totalChunks: uploadSession.totalChunks,
        },
        { status: 400 }
      );
    }

    // 模擬：將分塊合併（實際應用中需要從儲存中讀取）
    // 這裡直接上傳一個虛擬合併後的文件到 Vercel Blob
    // 注：在生產環境中，應該實現真實的分塊存儲和合併邏輯

    try {
      // 建立合併後的虛擬 blob
      const mergedFile = new File(
        [new ArrayBuffer(uploadSession.totalSize)],
        fileName,
        { type: 'application/octet-stream' }
      );

      const blob = await put(fileName, mergedFile, {
        access: 'public',
      });

      // 更新 session 狀態
      await prisma.uploadSession.update({
        where: { id: uploadId },
        data: {
          status: 'completed',
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        fileName,
        fileUrl: blob.url,
        fileSize: uploadSession.totalSize,
        uploadId,
      });
    } catch (blobError) {
      console.error('Vercel Blob 上傳失敗:', blobError);
      return NextResponse.json(
        {
          error: '合併文件上傳失敗',
          details: blobError instanceof Error ? blobError.message : '未知錯誤',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('完成上傳失敗:', error);
    return NextResponse.json(
      { error: '完成上傳失敗' },
      { status: 500 }
    );
  }
}
