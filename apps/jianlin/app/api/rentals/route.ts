import { NextRequest, NextResponse } from 'next/server';
import { getRentals } from '@/lib/data/db';

/**
 * GET /api/rentals
 *
 * 取得所有不動產租售資料
 * 公開 API，不需要認證
 */
export async function GET(request: NextRequest) {
  try {
    const rentals = await getRentals();

    return NextResponse.json(
      {
        rentals,
        total: rentals.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch rentals:', error);
    return NextResponse.json(
      { error: 'FETCH_FAILED' },
      { status: 500 }
    );
  }
}
