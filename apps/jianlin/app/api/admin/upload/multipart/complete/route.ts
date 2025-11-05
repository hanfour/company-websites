import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { completeMultipartUpload } from '@repo/upload-service/multipart';

/**
 * POST - 完成 Multipart Upload
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { key, uploadId, parts } = await request.json();

    if (!key || !uploadId || !parts || !Array.isArray(parts)) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要欄位' },
        { status: 400 }
      );
    }

    await completeMultipartUpload(key, uploadId, parts);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Complete multipart upload error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '完成上傳失敗' },
      { status: 500 }
    );
  }
}
