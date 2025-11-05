import { describe, it, expect, vi } from 'vitest';
import { verifyPassword, hashPassword, createToken, verifyToken, getCurrentUser, isAdmin, setAuthCookie, clearAuthCookie } from '../auth';

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('Auth Utilities', () => {
  describe('hashPassword & verifyPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);

      // Hash should be different from original password
      expect(hashed).not.toBe(password);
      // Hash should have length > 0
      expect(hashed.length).toBeGreaterThan(0);
      // Hash should start with bcrypt identifier
      expect(hashed).toMatch(/^\$2[aby]\$/);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(wrongPassword, hashed);

      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });
  });

  describe('createToken & verifyToken', () => {
    it('should create valid JWT token', async () => {
      const payload = {
        account: 'testuser',
        type: 1,
      };

      const token = await createToken(payload);

      // Token should be a string
      expect(typeof token).toBe('string');
      // Token should have 3 parts (header.payload.signature)
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify valid token and return payload', async () => {
      const payload = {
        account: 'testuser',
        type: 1,
      };

      const token = await createToken(payload);
      const verified = await verifyToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.account).toBe('testuser');
      expect(verified?.type).toBe(1);
      expect(verified).toHaveProperty('iat'); // issued at
      expect(verified).toHaveProperty('exp'); // expiration
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.jwt.token';
      const verified = await verifyToken(invalidToken);

      expect(verified).toBeNull();
    });

    it('should reject malformed token', async () => {
      const malformedToken = 'notajwttoken';
      const verified = await verifyToken(malformedToken);

      expect(verified).toBeNull();
    });

    it('should create tokens with different payloads', async () => {
      const payload1 = { account: 'user1', type: 1 };
      const payload2 = { account: 'user2', type: 2 };

      const token1 = await createToken(payload1);
      const token2 = await createToken(payload2);

      expect(token1).not.toBe(token2);

      const verified1 = await verifyToken(token1);
      const verified2 = await verifyToken(token2);

      expect(verified1?.account).toBe('user1');
      expect(verified2?.account).toBe('user2');
    });
  });

  describe('Password and Token Integration', () => {
    it('should handle complete authentication flow', async () => {
      // 1. Hash password
      const password = 'securePassword123';
      const hashedPassword = await hashPassword(password);

      // 2. Verify password
      const isPasswordValid = await verifyPassword(password, hashedPassword);
      expect(isPasswordValid).toBe(true);

      // 3. Create token after successful login
      const userPayload = {
        account: 'admin',
        type: 1,
      };
      const token = await createToken(userPayload);

      // 4. Verify token
      const verifiedPayload = await verifyToken(token);
      expect(verifiedPayload?.account).toBe('admin');
      expect(verifiedPayload?.type).toBe(1);
    });
  });

  describe('Cookie-based Session Management', () => {
    it('should return null when no cookie is set', async () => {
      // Mock cookies to return empty
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue(undefined),
      } as any);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should return user from valid cookie', async () => {
      // Create a valid token
      const payload = { account: 'testuser', type: 1 };
      const token = await createToken(payload);

      // Mock cookies to return the token
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: token }),
      } as any);

      const user = await getCurrentUser();
      expect(user).toBeTruthy();
      expect(user?.account).toBe('testuser');
      expect(user?.type).toBe(1);
    });

    it('should return null for invalid cookie token', async () => {
      // Mock cookies to return an invalid token
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
      } as any);

      const user = await getCurrentUser();
      expect(user).toBeNull();
    });

    it('should correctly identify admin user', async () => {
      // Create admin token
      const adminPayload = { account: 'admin', type: 1 };
      const adminToken = await createToken(adminPayload);

      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: adminToken }),
      } as any);

      const isUserAdmin = await isAdmin();
      expect(isUserAdmin).toBe(true);
    });

    it('should correctly identify non-admin user', async () => {
      // Create non-admin token
      const userPayload = { account: 'user', type: 0 };
      const userToken = await createToken(userPayload);

      // Mock cookies
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn().mockReturnValue({ value: userToken }),
      } as any);

      const isUserAdmin = await isAdmin();
      expect(isUserAdmin).toBe(false);
    });

    it('should set auth cookie correctly', async () => {
      const mockSet = vi.fn();
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        set: mockSet,
      } as any);

      const token = 'test-token';
      await setAuthCookie(token);

      expect(mockSet).toHaveBeenCalledWith('userInfo', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
    });

    it('should clear auth cookie correctly', async () => {
      const mockDelete = vi.fn();
      const { cookies } = await import('next/headers');
      vi.mocked(cookies).mockResolvedValue({
        delete: mockDelete,
      } as any);

      await clearAuthCookie();

      expect(mockDelete).toHaveBeenCalledWith('userInfo');
    });
  });
});
