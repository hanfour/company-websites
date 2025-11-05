import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/auth';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createS3Client, getBucketName, getProjectPrefix, getPublicUrl } from '@repo/upload-service/s3';

export async function GET(request: NextRequest) {
  try {
    // 驗證管理員權限
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 列出 S3 bucket 中的所有圖片
    const s3Client = createS3Client();
    const bucket = getBucketName();
    const prefix = getProjectPrefix();

    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: `${prefix}images/`, // 僅列出 images/ 目錄下的文件
    });

    const response = await s3Client.send(command);

    // 格式化圖片列表
    const images = (response.Contents || [])
      .filter((item) => item.Key && item.Size && item.Size > 0) // 過濾掉目錄和空文件
      .map((item) => ({
        key: item.Key!,
        url: getPublicUrl(item.Key!),
        lastModified: item.LastModified?.toISOString() || new Date().toISOString(),
        size: item.Size || 0,
      }))
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()); // 按時間倒序

    return NextResponse.json({ images }, { status: 200 });
  } catch (error) {
    console.error('List images error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '獲取圖片列表失敗' },
      { status: 500 }
    );
  }
}
