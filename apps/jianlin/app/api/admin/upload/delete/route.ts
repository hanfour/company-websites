import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createS3Client, getBucketName, getProjectPrefix } from '@repo/upload-service/s3';

export async function DELETE(request: NextRequest) {
  try {
    // 驗證管理員權限
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: '缺少圖片 key' },
        { status: 400 }
      );
    }

    // 防止刪除非 images/ 目錄的文件
    const prefix = getProjectPrefix();
    const expectedPrefix = `${prefix}images/`;

    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: `只能刪除 ${expectedPrefix} 目錄下的文件` },
        { status: 400 }
      );
    }

    // 從 S3 刪除文件
    const s3Client = createS3Client();
    const bucket = getBucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: 'SUCCESS' }, { status: 200 });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '刪除圖片失敗' },
      { status: 500 }
    );
  }
}
