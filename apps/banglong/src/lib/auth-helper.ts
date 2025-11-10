import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

/**
 * Verify admin role for API routes
 * Returns error response if not admin, otherwise returns null
 *
 * Usage:
 * ```typescript
 * const authError = await requireAdmin();
 * if (authError) return authError;
 * ```
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: '未登入' },
      { status: 401 }
    );
  }

  if (session.user?.role !== 'ADMIN') {
    return NextResponse.json(
      { error: '需要管理員權限' },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Verify authentication (any logged-in user)
 * Returns error response if not authenticated, otherwise returns null
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: '未登入' },
      { status: 401 }
    );
  }

  return null;
}
