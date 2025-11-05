'use client';

import { useState, useEffect } from 'react';
import type { CarouselItem } from '@/types';
import ImageUploader from './ImageUploader';

export default function CarouselManager() {
  const [items, setItems] = useState<CarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<CarouselItem>({
    name: '',
    src: '',
    location: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCarouselItems();
  }, []);

  const loadCarouselItems = async () => {
    try {
      const response = await fetch('/api/admin/carousel');
      if (!response.ok) throw new Error('Failed to load carousel items');
      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      setError('載入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setFormData({ name: '', src: '', location: '' });
    setError('');
    setSuccess('');
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsAdding(false);
    setFormData({ ...items[index] });
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingIndex(null);
    setFormData({ name: '', src: '', location: '' });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name || !formData.src || !formData.location) {
      setError('所有欄位都必須填寫');
      return;
    }

    try {
      if (isAdding) {
        // 新增
        const response = await fetch('/api/admin/carousel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to add carousel item');
        setSuccess('新增成功！');
      } else if (editingIndex !== null) {
        // 更新
        const response = await fetch(`/api/admin/carousel/${editingIndex}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update carousel item');
        setSuccess('更新成功！');
      }

      // 重新載入資料
      await loadCarouselItems();
      handleCancel();
    } catch (err) {
      setError('操作失敗，請稍後再試');
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('確定要刪除此輪播圖嗎？')) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/carousel/${index}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete carousel item');
      setSuccess('刪除成功！');
      await loadCarouselItems();
    } catch (err) {
      setError('刪除失敗，請稍後再試');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];

    try {
      const response = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });

      if (!response.ok) throw new Error('Failed to reorder carousel items');
      setItems(newItems);
      setSuccess('順序已更新！');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('更新順序失敗，請稍後再試');
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];

    try {
      const response = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: newItems }),
      });

      if (!response.ok) throw new Error('Failed to reorder carousel items');
      setItems(newItems);
      setSuccess('順序已更新！');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('更新順序失敗，請稍後再試');
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

      {/* 新增按鈕 */}
      {!isAdding && editingIndex === null && (
        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            新增輪播圖
          </button>
        </div>
      )}

      {/* 編輯/新增表單 */}
      {(isAdding || editingIndex !== null) && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isAdding ? '新增輪播圖' : '編輯輪播圖'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：1.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                圖片上傳 <span className="text-red-500">*</span>
              </label>
              <ImageUploader
                currentImageUrl={formData.location}
                onUploadSuccess={({ publicUrl, key }) => {
                  setFormData({
                    ...formData,
                    src: key,
                    location: publicUrl,
                  });
                  setError('');
                }}
                onUploadError={(errorMsg) => {
                  setError(errorMsg);
                }}
              />
              {formData.location && (
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">已設定的圖片：</p>
                  <p className="text-xs break-all text-gray-500">{formData.location}</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                {isAdding ? '建立' : '更新'}
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

      {/* 輪播圖列表 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            輪播圖列表 ({items.length} 張)
          </h3>
        </div>
        {items.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            目前沒有輪播圖，請新增第一張輪播圖
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item, index) => (
              <div
                key={index}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
              >
                {/* 預覽圖 */}
                <div className="w-32 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={item.location}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                </div>

                {/* 資訊 */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{item.name}</div>
                  <div className="text-sm text-gray-500 truncate">{item.src}</div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* 上移 */}
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="p-2 text-gray-600 hover:text-[var(--main-color)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="上移"
                  >
                    ↑
                  </button>
                  {/* 下移 */}
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === items.length - 1}
                    className="p-2 text-gray-600 hover:text-[var(--main-color)] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="下移"
                  >
                    ↓
                  </button>
                  {/* 編輯 */}
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-3 py-1 text-[var(--main-color)] hover:text-opacity-80"
                  >
                    編輯
                  </button>
                  {/* 刪除 */}
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-3 py-1 text-red-600 hover:text-red-900"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
