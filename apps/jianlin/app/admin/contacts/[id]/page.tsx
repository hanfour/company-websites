'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { ContactMessage } from '@/types';

export default function ContactDetail() {
  const router = useRouter();
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminReply, setAdminReply] = useState('');

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contacts/${contactId}`);

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('載入失敗');
      }

      const result = await response.json();
      setContact(result.data);
      setAdminReply(result.data.adminReply || '');
    } catch (error) {
      console.error('Load contact error:', error);
      alert('載入詳情失敗');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: 'pending' | 'replied' | 'archived') => {
    if (!contact) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('更新失敗');

      const result = await response.json();
      setContact(result.data);
      alert('狀態更新成功');
    } catch (error) {
      console.error('Update status error:', error);
      alert('更新狀態失敗');
    } finally {
      setUpdating(false);
    }
  };

  const saveReply = async () => {
    if (!contact || !adminReply.trim()) {
      alert('請輸入回覆內容');
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'replied',
          adminReply: adminReply.trim(),
        }),
      });

      if (!response.ok) throw new Error('儲存失敗');

      const result = await response.json();
      setContact(result.data);
      alert('回覆儲存成功');
    } catch (error) {
      console.error('Save reply error:', error);
      alert('儲存回覆失敗');
    } finally {
      setUpdating(false);
    }
  };

  const deleteContact = async () => {
    if (!confirm('確定要刪除這筆聯絡表單嗎？')) return;

    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('刪除失敗');

      alert('刪除成功');
      router.push('/admin/contacts');
    } catch (error) {
      console.error('Delete contact error:', error);
      alert('刪除失敗');
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      replied: 'bg-green-100 text-green-800',
      archived: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending: '待處理',
      replied: '已回覆',
      archived: '已歸檔',
    };
    return (
      <span className={`px-3 py-1 text-sm rounded ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center py-12">
          <p className="text-gray-600">聯絡表單不存在</p>
          <button
            onClick={() => router.push('/admin/contacts')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <button
              onClick={() => router.push('/admin/contacts')}
              className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
            >
              ← 返回列表
            </button>
            <h1 className="text-2xl font-bold text-gray-900">聯絡表單詳情</h1>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(contact.status)}
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">客戶資訊</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">姓名</label>
              <p className="font-medium">{contact.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <p className="font-medium">
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </p>
            </div>
            {contact.phone && (
              <div>
                <label className="text-sm text-gray-600">電話</label>
                <p className="font-medium">
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </p>
              </div>
            )}
            {contact.category && (
              <div>
                <label className="text-sm text-gray-600">分類</label>
                <p className="font-medium">{contact.category}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">提交時間</label>
              <p className="font-medium">{formatDate(contact.createdAt)}</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">ID</label>
              <p className="font-mono text-xs text-gray-500">{contact.id}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {contact.subject ? `主旨: ${contact.subject}` : '訊息內容'}
          </h2>
          <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">
            {contact.message}
          </div>
        </div>

        {/* Admin Reply */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">管理員回覆</h2>
          {contact.status === 'replied' && contact.repliedAt && (
            <div className="mb-4 text-sm text-gray-600">
              回覆時間: {formatDate(contact.repliedAt)}
              {contact.repliedBy && ` | 回覆人: ${contact.repliedBy}`}
            </div>
          )}
          <textarea
            value={adminReply}
            onChange={(e) => setAdminReply(e.target.value)}
            className="w-full border border-gray-300 rounded p-3 mb-4"
            rows={6}
            placeholder="輸入回覆內容..."
          />
          <button
            onClick={saveReply}
            disabled={updating || !adminReply.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? '儲存中...' : '儲存回覆'}
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">操作</h2>
          <div className="flex gap-2">
            <button
              onClick={() => updateStatus('pending')}
              disabled={updating || contact.status === 'pending'}
              className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 disabled:opacity-50"
            >
              標記為待處理
            </button>
            <button
              onClick={() => updateStatus('replied')}
              disabled={updating || contact.status === 'replied'}
              className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 disabled:opacity-50"
            >
              標記為已回覆
            </button>
            <button
              onClick={() => updateStatus('archived')}
              disabled={updating || contact.status === 'archived'}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              歸檔
            </button>
            <button
              onClick={deleteContact}
              disabled={updating}
              className="ml-auto px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
