'use client';

import { useState } from 'react';
import { updatePassword } from '@/app/actions';

export default function AdminAccount() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setStatus({ type: 'error', message: '新密碼與確認密碼不符' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setStatus({ type: 'error', message: '密碼長度至少需要 6 個字元' });
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('newPassword', formData.newPassword);

    const result = await updatePassword(formDataObj);

    if (result?.error) {
      setStatus({ type: 'error', message: '密碼更新失敗' });
    } else {
      setStatus({ type: 'success', message: '密碼更新成功' });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">修改登入密碼</h1>

      <div className="bg-white shadow rounded-lg p-6 max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              新密碼
            </label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              確認新密碼
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            更新密碼
          </button>

          {status && (
            <div
              className={`p-4 rounded-lg ${
                status.type === 'success'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {status.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
