import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/auth/auth';
import { generatePresignedUploadUrl, isValidDocumentType, isValidFileSize } from '@repo/upload-service/presign';

/**
 * POST - 產生文件上傳的預簽名 URL
 *
 * 支援格式：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP
 * 最大檔案：250MB
 * URL 有效期：60 分鐘（足夠上傳大檔案）
 */
export async function POST(request: NextRequest) {
  try {
    // 檢查權限
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    // 獲取請求數據
    const { filename, contentType, fileSize } = await request.json();

    // 驗證必要欄位
    if (!filename || !contentType || fileSize === undefined) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '缺少必要欄位：filename、contentType、fileSize' },
        { status: 400 }
      );
    }

    // 驗證檔案類型
    if (!isValidDocumentType(contentType)) {
      return NextResponse.json(
        {
          error: 'INVALID_FILE_TYPE',
          message: '不支援的檔案格式，僅支援：PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP'
        },
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

    // 產生預簽名 URL（60 分鐘有效期，subfolder: documents/）
    const result = await generatePresignedUploadUrl(
      filename,
      contentType,
      'documents/',
      3600, // 60 分鐘
      'document'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Generate presigned URL error:', error);

    // 區分不同錯誤類型
    if (error instanceof Error) {
      // AWS 憑證錯誤
      if (error.message.includes('AWS credentials') || error.message.includes('AWS_')) {
        return NextResponse.json(
          { error: 'AWS_CONFIG_ERROR', message: 'AWS 設定錯誤，請檢查環境變數' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '產生上傳 URL 失敗' },
      { status: 500 }
    );
  }
}
