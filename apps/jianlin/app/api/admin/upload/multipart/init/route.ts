import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { initMultipartUpload } from '@repo/upload-service/multipart';
import { isValidDocumentType, isValidFileSize } from '@repo/upload-service/presign';

/**
 * POST - 初始化 Multipart Upload
 *
 * 用於大檔案上傳（支援 250MB）
 * 將檔案分片上傳，支援斷點續傳
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { filename, contentType, fileSize, subfolder } = await request.json();

    if (!filename || !contentType || fileSize === undefined) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!isValidDocumentType(contentType)) {
      return NextResponse.json(
        { error: 'INVALID_FILE_TYPE', message: '不支援的檔案格式' },
        { status: 400 }
      );
    }

    // 驗證檔案大小（250MB）
    if (!isValidFileSize(fileSize, 250)) {
      return NextResponse.json(
        { error: 'FILE_TOO_LARGE', message: '檔案大小超過 250MB' },
        { status: 400 }
      );
    }

    const result = await initMultipartUpload(
      filename,
      contentType,
      fileSize,
      subfolder || 'documents/'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Init multipart upload error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '初始化上傳失敗' },
      { status: 500 }
    );
  }
}
