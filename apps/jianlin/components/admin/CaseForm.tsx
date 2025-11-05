'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CaseItem, ImageItem } from '@/types';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

interface CaseFormProps {
  initialData?: CaseItem;
  type: 'hot' | 'history';
  mode: 'create' | 'edit';
}

export default function CaseForm({ initialData, type, mode }: CaseFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<CaseItem>>(
    initialData || {
      numberID: `${type}${Date.now()}`,
      id: 0,
      name: '',
      sub: '',
      caption: '',
      outline: '',
      address: '',
      slider: [],
      src: [],
      status: type === 'hot' ? 0 : 1,
      type,
      data_uploader: new Date().toISOString().split('T')[0],
      data_editor: new Date().toISOString().split('T')[0],
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const url = mode === 'create' ? '/api/admin/cases' : `/api/admin/cases/${initialData?.numberID}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          type,
          data_editor: new Date().toISOString().split('T')[0],
          createdAt: mode === 'create' ? new Date().toISOString() : initialData?.createdAt,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗');
      }

      router.push(`/admin/${type}_list`);
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
      setError('儲存失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateImages = (images: ImageItem[], field: 'slider' | 'src') => {
    setFormData({
      ...formData,
      [field]: images,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* 基本資訊 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">基本資訊</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 個案編號 */}
          <div>
            <label htmlFor="numberID" className="block text-sm font-medium text-gray-700 mb-2">
              個案編號 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="numberID"
              required
              disabled={mode === 'edit'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] disabled:bg-gray-100"
              value={formData.numberID}
              onChange={(e) => setFormData({ ...formData, numberID: e.target.value })}
              placeholder="例如：hot001"
            />
            <p className="mt-1 text-sm text-gray-500">唯一識別碼，建立後無法修改</p>
          </div>

          {/* 類型顯示 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              類型
            </label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
              {type === 'hot' ? '熱銷個案' : '歷年個案'}
            </div>
          </div>

          {/* 標題 */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：新竹之昇"
            />
          </div>

          {/* 副標題 */}
          <div className="md:col-span-2">
            <label htmlFor="sub" className="block text-sm font-medium text-gray-700 mb-2">
              副標題
            </label>
            <RichTextEditor
              value={formData.sub || ''}
              onChange={(value) => setFormData({ ...formData, sub: value })}
              placeholder="選填，支援 HTML 格式"
            />
          </div>

          {/* 地址 */}
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              地址/座標
            </label>
            <input
              type="text"
              id="address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="選填"
            />
          </div>
        </div>
      </div>

      {/* 內容說明 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">內容說明</h3>

        {/* 詳細描述 */}
        <div className="mb-6">
          <label htmlFor="outline" className="block text-sm font-medium text-gray-700 mb-2">
            詳細描述
          </label>
          <RichTextEditor
            value={formData.outline || ''}
            onChange={(value) => setFormData({ ...formData, outline: value })}
            placeholder="開始輸入詳細描述..."
          />
        </div>

        {/* 頁面底部說明 */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            頁面底部說明
          </label>
          <RichTextEditor
            value={formData.caption || ''}
            onChange={(value) => setFormData({ ...formData, caption: value })}
            placeholder="開始輸入底部說明..."
          />
        </div>
      </div>

      {/* 圖片管理 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">圖片管理</h3>

        {/* 頂部輪播圖 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            頂部輪播圖 (slider)
          </label>
          <p className="text-sm text-gray-500 mb-3">用於詳細頁面頂部輪播展示</p>
          <MultiImageUploader
            images={formData.slider || []}
            onChange={(images) => handleUpdateImages(images, 'slider')}
            maxImages={10}
          />
        </div>

        {/* 內容區圖片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            內容區圖片 (src)
          </label>
          <p className="text-sm text-gray-500 mb-3">用於詳細頁面「個案相片」區塊</p>
          <MultiImageUploader
            images={formData.src || []}
            onChange={(images) => handleUpdateImages(images, 'src')}
            maxImages={20}
          />
        </div>
      </div>

      {/* 外部連結 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">外部連結</h3>

        <div className="grid grid-cols-1 gap-6">
          {/* 海悅案場連結 */}
          <div>
            <label htmlFor="broking" className="block text-sm font-medium text-gray-700 mb-2">
              海悅案場連結
            </label>
            <input
              type="url"
              id="broking"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.broking || ''}
              onChange={(e) => setFormData({ ...formData, broking: e.target.value })}
              placeholder="https://..."
            />
          </div>

          {/* Facebook 連結 */}
          <div>
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
              Facebook 連結
            </label>
            <input
              type="url"
              id="facebook"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.facebook || ''}
              onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
              placeholder="https://facebook.com/..."
            />
          </div>

          {/* 詳細頁面連結 */}
          <div>
            <label htmlFor="detailed" className="block text-sm font-medium text-gray-700 mb-2">
              詳細頁面連結
            </label>
            <input
              type="url"
              id="detailed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.detailed || ''}
              onChange={(e) => setFormData({ ...formData, detailed: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '儲存中...' : mode === 'create' ? '建立個案' : '更新個案'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          取消
        </button>
      </div>
    </form>
  );
}
