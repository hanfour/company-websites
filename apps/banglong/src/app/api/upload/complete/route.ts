import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { put, del } from '@vercel/blob';

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

    const chunkUrls = uploadSession.chunkUrls as Record<string, string>;

    try {
      // 1. 下載所有 chunks 並按順序合併
      const chunkBuffers: ArrayBuffer[] = [];

      for (let i = 0; i < uploadSession.totalChunks; i++) {
        const chunkUrl = chunkUrls[i.toString()];
        if (!chunkUrl) {
          throw new Error(`分塊 ${i} 的 URL 不存在`);
        }

        // 從 Blob 下載 chunk
        const response = await fetch(chunkUrl);
        if (!response.ok) {
          throw new Error(`下載分塊 ${i} 失敗: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        chunkBuffers.push(buffer);
      }

      // 2. 合併所有 chunks
      const totalLength = chunkBuffers.reduce((sum, buf) => sum + buf.byteLength, 0);
      const mergedBuffer = new Uint8Array(totalLength);
      let offset = 0;

      for (const buffer of chunkBuffers) {
        mergedBuffer.set(new Uint8Array(buffer), offset);
        offset += buffer.byteLength;
      }

      // 3. 上傳合併後的文件（使用原始文件名，保留中文）
      const blob = await put(fileName, mergedBuffer.buffer, {
        access: 'public',
      });

      // 4. 清理臨時 chunks
      const deletePromises = Object.values(chunkUrls).map((url) =>
        del(url).catch((err) => {
          console.error(`刪除臨時 chunk 失敗: ${url}`, err);
        })
      );
      await Promise.allSettled(deletePromises);

      // 5. 更新 session 狀態
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
        fileSize: totalLength,
        uploadId,
      });
    } catch (blobError) {
      console.error('文件合併失敗:', blobError);
      return NextResponse.json(
        {
          error: '合併文件失敗',
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
