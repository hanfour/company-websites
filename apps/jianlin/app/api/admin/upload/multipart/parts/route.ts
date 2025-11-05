import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { getAllPartUploadUrls } from '@repo/upload-service/multipart';

/**
 * POST - 取得所有分片的預簽名 URL
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { key, uploadId, totalParts } = await request.json();

    if (!key || !uploadId || !totalParts) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const urls = await getAllPartUploadUrls(key, uploadId, totalParts);

    return NextResponse.json({ parts: urls }, { status: 200 });
  } catch (error) {
    console.error('Get part upload URLs error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '取得上傳 URL 失敗' },
      { status: 500 }
    );
  }
}
