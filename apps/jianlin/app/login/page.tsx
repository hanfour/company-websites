'use client';

import { useState } from 'react';
import { login } from '@/app/actions';
import Image from 'next/image';

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    account: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formDataObj = new FormData();
    formDataObj.append('account', formData.account);
    formDataObj.append('password', formData.password);

    try {
      const result = await login(formDataObj);
      if (result?.error) {
        switch (result.error) {
          case 'MISSING_FIELDS':
            setError('請輸入帳號和密碼');
            break;
          case 'USER_NOT_FOUND':
          case 'INVALID_PASSWORD':
            setError('帳號或密碼錯誤');
            break;
          default:
            setError('登入失敗，請稍後再試');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登入失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Image
              src="/logo.svg"
              alt="建林工業"
              width={200}
              height={60}
              className="mx-auto"
            />
          </div>
          <h2 className="mt-6 text-center text-3xl font-light text-gray-900">
            後台管理系統
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="account" className="sr-only">
                帳號
              </label>
              <input
                id="account"
                name="account"
                type="text"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--main-color)] focus:border-[var(--main-color)] focus:z-10"
                placeholder="帳號"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[var(--main-color)] focus:border-[var(--main-color)] focus:z-10"
                placeholder="密碼"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[var(--main-color)] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--main-color)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '登入中...' : '登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
