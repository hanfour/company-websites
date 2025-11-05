import { NextResponse } from 'next/server';
import { getAboutItems } from '@/lib/data/db';

// GET - 獲取關於建林內容
export async function GET() {
  try {
    const items = await getAboutItems();
    return NextResponse.json({ items }, { status: 200 });
  } catch (error) {
    console.error('Get about items error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
