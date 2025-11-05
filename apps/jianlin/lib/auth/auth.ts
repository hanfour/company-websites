import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { JWTPayload } from '@/types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

// 驗證密碼
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Hash 密碼
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// 創建 JWT Token
export async function createToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

// 驗證 JWT Token
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// 從 Cookie 獲取當前用戶
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('userInfo')?.value;

  if (!token) return null;

  return verifyToken(token);
}

// 檢查是否為管理員
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.type === 1;
}

// 設置 Cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('userInfo', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// 清除 Cookie
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('userInfo');
}
