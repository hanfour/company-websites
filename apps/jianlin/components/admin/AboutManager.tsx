'use client';

import { useState, useEffect } from 'react';
import type { AboutItem } from '@/types';
import RichTextEditor from '@/components/ui/RichTextEditor';

const aboutLabels = {
  item_1: '關於建林',
  item_2: '經營理念',
  item_3: '未來展望',
  item_4: '售後服務',
};

export default function AboutManager() {
  const [items, setItems] = useState<AboutItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<'item_1' | 'item_2' | 'item_3' | 'item_4' | null>(null);
  const [formData, setFormData] = useState<Partial<AboutItem>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadAboutItems();
  }, []);

  const loadAboutItems = async () => {
    try {
      const response = await fetch('/api/admin/about');
      if (!response.ok) throw new Error('Failed to load about items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (type: 'item_1' | 'item_2' | 'item_3' | 'item_4') => {
    const item = items.find(i => i.type === type);
    setEditingType(type);
    setFormData(item || { type, title: '', caption: '', src: '', location: '' });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditingType(null);
    setFormData({});
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    setError('');
    setSuccess('');

    if (!formData.title || !formData.src) {
      setError('標題和圖片路徑為必填');
      return;
    }

    try {
      const response = await fetch(`/api/admin/about/${editingType}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update about item');
      setSuccess('更新成功！');
      await loadAboutItems();
      setTimeout(() => handleCancel(), 1500);
    } catch (err) {
      setError('更新失敗，請稍後再試');
    }
  };

  if (loading) {
    return <div className="text-gray-600">載入中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 訊息提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* 編輯表單 */}
      {editingType && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            編輯：{aboutLabels[editingType]}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                標題 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                內文
              </label>
              <RichTextEditor
                value={formData.caption || ''}
                onChange={(value) => setFormData({ ...formData, caption: value })}
                placeholder="輸入內文..."
              />
            </div>

            <div>
              <label htmlFor="src" className="block text-sm font-medium text-gray-700 mb-2">
                圖片路徑 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="src"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
                value={formData.src || ''}
                onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                placeholder="例如：images/70931496615.jpeg"
              />
              <p className="mt-1 text-sm text-gray-500">
                圖片將從 CDN ({process.env.NEXT_PUBLIC_CDN_LINK}) 載入
              </p>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                完整 URL (選填)
              </label>
              <input
                type="text"
                id="location"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例如：https://jienlin.s3-ap-northeast-1.amazonaws.com/images/70931496615.jpeg"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                更新
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 內容區塊列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            關於建林內容區塊 (4 個)
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {(['item_1', 'item_2', 'item_3', 'item_4'] as const).map((type) => {
            const item = items.find(i => i.type === type);
            return (
              <div
                key={type}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      {aboutLabels[type]}
                    </h4>
                    {item && (
                      <p className="text-sm text-gray-600 mt-1">{item.title}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleEdit(type)}
                    className="ml-4 px-4 py-2 text-[var(--main-color)] hover:text-opacity-80 border border-[var(--main-color)] rounded-lg transition-colors"
                  >
                    {item ? '編輯' : '新增'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
