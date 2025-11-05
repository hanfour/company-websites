'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { RentalItem, ImageItem, CustomField } from '@/types';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MultiImageUploader from '@/components/admin/MultiImageUploader';

interface RentalFormProps {
  initialData?: RentalItem;
  mode: 'create' | 'edit';
}

export default function RentalForm({ initialData, mode }: RentalFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<RentalItem>>(
    initialData || {
      numberID: `rental${Date.now()}`,
      id: 0,
      name: '',
      sub: '',
      caption: '',
      address: '',
      price: '',
      floor: '',
      application: '',
      property: '',
      slider: [],
      src: [],
      customFields: [],
      status: 0,
      show: true,
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
      const url = mode === 'create' ? '/api/admin/rentals' : `/api/admin/rentals/${initialData?.numberID}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          data_editor: new Date().toISOString().split('T')[0],
          createdAt: mode === 'create' ? new Date().toISOString() : initialData?.createdAt,
          updatedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('儲存失敗');
      }

      router.push('/admin/real_estate_list');
      router.refresh();
    } catch (err) {
      console.error('Submit error:', err);
      setError('儲存失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = (images: ImageItem[], type: 'slider' | 'src') => {
    setFormData({
      ...formData,
      [type]: images,
    });
  };

  // 自訂欄位管理函數
  const handleAddCustomField = () => {
    const newField: CustomField = {
      id: `field_${Date.now()}`,
      label: '',
      fieldType: 'input',
      value: '',
      order: (formData.customFields || []).length,
    };
    setFormData({
      ...formData,
      customFields: [...(formData.customFields || []), newField],
    });
  };

  const handleUpdateCustomField = (id: string, updates: Partial<CustomField>) => {
    setFormData({
      ...formData,
      customFields: (formData.customFields || []).map(field =>
        field.id === id ? { ...field, ...updates } : field
      ),
    });
  };

  const handleDeleteCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: (formData.customFields || []).filter(field => field.id !== id),
    });
  };

  const handleMoveCustomField = (index: number, direction: 'up' | 'down') => {
    const fields = [...(formData.customFields || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= fields.length) return;

    [fields[index], fields[targetIndex]] = [fields[targetIndex], fields[index]];
    fields.forEach((field, i) => field.order = i);

    setFormData({
      ...formData,
      customFields: fields,
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
          {/* 物件編號 */}
          <div>
            <label htmlFor="numberID" className="block text-sm font-medium text-gray-700 mb-2">
              物件編號 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="numberID"
              required
              disabled={mode === 'edit'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] disabled:bg-gray-100"
              value={formData.numberID}
              onChange={(e) => setFormData({ ...formData, numberID: e.target.value })}
              placeholder="例如：rental001"
            />
            <p className="mt-1 text-sm text-gray-500">唯一識別碼，建立後無法修改</p>
          </div>

          {/* 租售類型 */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              租售類型 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
            >
              <option value={0}>出租</option>
              <option value={1}>出售</option>
            </select>
          </div>

          {/* 物件名稱 */}
          <div className="md:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              物件名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：竹北豪宅"
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

          {/* 顯示開關 */}
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.show !== false}
                onChange={(e) => setFormData({ ...formData, show: e.target.checked })}
                className="w-4 h-4 text-[var(--main-color)] border-gray-300 rounded focus:ring-2 focus:ring-[var(--main-color)]"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                在前台顯示此物件
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* 物件詳情 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">物件詳情</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 價格 */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              價格
            </label>
            <input
              type="text"
              id="price"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="例如：30,000 元/月"
            />
          </div>

          {/* 坪數 */}
          <div>
            <label htmlFor="floor" className="block text-sm font-medium text-gray-700 mb-2">
              坪數
            </label>
            <input
              type="text"
              id="floor"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.floor || ''}
              onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              placeholder="例如：50 坪"
            />
          </div>

          {/* 用途 */}
          <div>
            <label htmlFor="application" className="block text-sm font-medium text-gray-700 mb-2">
              用途
            </label>
            <input
              type="text"
              id="application"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.application || ''}
              onChange={(e) => setFormData({ ...formData, application: e.target.value })}
              placeholder="例如：住宅、店面"
            />
          </div>

          {/* 地址 */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              地址
            </label>
            <input
              type="text"
              id="address"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="例如：新竹縣竹北市"
            />
          </div>

          {/* 產權 */}
          <div className="md:col-span-2">
            <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-2">
              產權登記資料
            </label>
            <textarea
              id="property"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)]"
              value={formData.property || ''}
              onChange={(e) => setFormData({ ...formData, property: e.target.value })}
              placeholder="選填"
            />
          </div>
        </div>
      </div>

      {/* 內容說明 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">內容說明</h3>

        <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
          內文介紹
        </label>
        <RichTextEditor
          value={formData.caption || ''}
          onChange={(value) => setFormData({ ...formData, caption: value })}
          placeholder="開始輸入物件介紹..."
        />
        <p className="mt-2 text-sm text-gray-500">使用富文本編輯器格式化內容</p>
      </div>

      {/* 自訂欄位 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">自訂欄位</h3>
            <p className="text-sm text-gray-500 mt-1">新增額外的物件資訊欄位</p>
          </div>
          <button
            type="button"
            onClick={handleAddCustomField}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            + 新增欄位
          </button>
        </div>

        {(formData.customFields || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            尚無自訂欄位，點擊「新增欄位」開始建立
          </div>
        ) : (
          <div className="space-y-4">
            {(formData.customFields || []).map((field, index) => (
              <div key={field.id} data-testid={`custom-field-${field.id}`} className="border border-gray-200 rounded-lg p-4">
                {/* 欄位標題和操作按鈕 */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleMoveCustomField(index, 'up')}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCustomField(index, 'down')}
                      disabled={index === (formData.customFields || []).length - 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 欄位標題 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        欄位標題 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleUpdateCustomField(field.id, { label: e.target.value })}
                        placeholder="例如：車位數量"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* 欄位類型 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        欄位類型
                      </label>
                      <select
                        value={field.fieldType}
                        onChange={(e) => handleUpdateCustomField(field.id, { fieldType: e.target.value as CustomField['fieldType'] })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="input">單行文字</option>
                        <option value="textarea">多行文字</option>
                        <option value="richtext">富文本編輯器</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomField(field.id)}
                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    刪除
                  </button>
                </div>

                {/* 欄位內容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    欄位內容
                  </label>
                  {field.fieldType === 'input' && (
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => handleUpdateCustomField(field.id, { value: e.target.value })}
                      placeholder="輸入內容..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  {field.fieldType === 'textarea' && (
                    <textarea
                      value={field.value}
                      onChange={(e) => handleUpdateCustomField(field.id, { value: e.target.value })}
                      placeholder="輸入內容..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                  {field.fieldType === 'richtext' && (
                    <RichTextEditor
                      value={field.value}
                      onChange={(value) => handleUpdateCustomField(field.id, { value })}
                      placeholder="開始輸入內容..."
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 圖片管理 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">圖片管理</h3>

        {/* 輪播圖 */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            頂部輪播圖 (slider)
          </label>
          <p className="text-sm text-gray-500 mb-3">用於詳細頁面頂部輪播展示</p>
          <MultiImageUploader
            images={formData.slider || []}
            onChange={(images) => handleAddImage(images, 'slider')}
            maxImages={10}
          />
        </div>

        {/* 內容區圖片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            內容區圖片 (src)
          </label>
          <p className="text-sm text-gray-500 mb-3">用於詳細頁面「物件相片」區塊</p>
          <MultiImageUploader
            images={formData.src || []}
            onChange={(images) => handleAddImage(images, 'src')}
            maxImages={20}
          />
        </div>
      </div>

      {/* 按鈕 */}
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '儲存中...' : mode === 'create' ? '建立物件' : '更新物件'}
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
