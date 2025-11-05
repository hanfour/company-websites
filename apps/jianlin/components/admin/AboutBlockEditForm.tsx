'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MultiImageUploader from '@/components/admin/MultiImageUploader';
import type { AboutItem, AboutLayoutTemplate, ImageItem } from '@/types';

interface AboutBlockEditFormProps {
  blockId: string;
  initialBlock: Partial<AboutItem>;
  allBlocks: any[];
}

const layoutTemplates: Array<{
  value: AboutLayoutTemplate;
  label: string;
  description: string;
  preview: string;
}> = [
  {
    value: 'text-only',
    label: '純文字',
    description: '僅包含標題和富文本內容，適合純文字說明',
    preview: '📝 標題\n━━━━━━\n內容內容內容\n內容內容內容',
  },
  {
    value: 'text-with-top-image',
    label: '上圖下文',
    description: '圖片在上方（滿版寬），標題和內容在下方',
    preview: '┌─────────┐\n│  🖼️ 圖片  │\n└─────────┘\n━━━━━━\n內容內容內容',
  },
  {
    value: 'text-with-left-image',
    label: '左圖右文',
    description: '圖片在左側，標題和內容在右側',
    preview: '┌────┐ 📝 標題\n│ 🖼️ │ ━━━━━━\n│圖片│ 內容內容\n└────┘ 內容內容',
  },
  {
    value: 'text-with-right-image',
    label: '右圖左文',
    description: '標題和內容在左側，圖片在右側',
    preview: '📝 標題 ┌────┐\n━━━━━━ │ 🖼️ │\n內容內容 │圖片│\n內容內容 └────┘',
  },
  {
    value: 'image-only',
    label: '純圖片',
    description: '僅顯示圖片',
    preview: '┌─────────┐\n│         │\n│  🖼️ 圖片  │\n│         │\n└─────────┘',
  },
];

export default function AboutBlockEditForm({ blockId, initialBlock, allBlocks }: AboutBlockEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [block, setBlock] = useState<Partial<AboutItem>>(initialBlock);
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialBlock.src || initialBlock.location) {
      return [{
        name: initialBlock.title || 'image',
        src: initialBlock.src || '',
        location: initialBlock.location || '',
      }];
    }
    return [];
  });

  const selectedTemplate = block.layoutTemplate || 'text-only';
  const needsImage = selectedTemplate !== 'text-only';

  async function handleSave() {
    if (!block.title) {
      alert('請輸入標題');
      return;
    }

    if (needsImage && images.length === 0) {
      alert('此佈局模板需要圖片，請上傳圖片');
      return;
    }

    try {
      setLoading(true);

      // 更新圖片資訊
      const updatedBlock = {
        ...block,
        src: images[0]?.src || '',
        location: images[0]?.location || '',
      };

      // 更新或新增
      let newBlocks = [...allBlocks];
      const index = newBlocks.findIndex((b: any) =>
        b.id === blockId || `block_${b.type}` === blockId
      );

      if (index >= 0) {
        newBlocks[index] = updatedBlock;
      } else {
        newBlocks.push(updatedBlock);
      }

      // 儲存
      const saveRes = await fetch('/api/admin/about-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: newBlocks }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save');
      }

      alert('儲存成功！');
      router.push('/admin/about-blocks');
      router.refresh();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('儲存失敗');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {blockId.startsWith('block_') && !blockId.includes('item') ? '新增' : '編輯'}關於建林區塊
        </h1>
        <div className="space-x-2">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '儲存中...' : '儲存'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* 佈局模板選擇 */}
        <div>
          <label className="block text-sm font-medium mb-3">
            選擇佈局模板<span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {layoutTemplates.map((template) => (
              <div
                key={template.value}
                onClick={() => setBlock({ ...block, layoutTemplate: template.value })}
                className={`
                  relative p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedTemplate === template.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="layoutTemplate"
                    value={template.value}
                    checked={selectedTemplate === template.value}
                    onChange={() => setBlock({ ...block, layoutTemplate: template.value })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{template.label}</div>
                    <div className="text-xs text-gray-600 mb-2">{template.description}</div>
                    <pre className="text-xs text-gray-500 bg-gray-50 p-2 rounded whitespace-pre font-mono leading-tight">
                      {template.preview}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 標題 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            標題<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={block.title || ''}
            onChange={(e) => setBlock({ ...block, title: e.target.value })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="例如：關於建林"
          />
        </div>

        {/* 富文本內容 */}
        {selectedTemplate !== 'image-only' && (
          <div>
            <label className="block text-sm font-medium mb-2">內容</label>
            <RichTextEditor
              value={block.caption || ''}
              onChange={(value) => setBlock({ ...block, caption: value })}
            />
          </div>
        )}

        {/* 圖片 */}
        {needsImage && (
          <div>
            <label className="block text-sm font-medium mb-2">
              圖片{(selectedTemplate === 'text-with-top-image' || selectedTemplate === 'text-with-left-image' || selectedTemplate === 'text-with-right-image') ? <span className="text-red-500">*</span> : ''}
            </label>
            <MultiImageUploader
              images={images}
              onChange={setImages}
              maxImages={1}
            />
            {images.length === 0 && needsImage && (
              <p className="text-sm text-red-500 mt-2">此佈局模板需要圖片</p>
            )}
          </div>
        )}

        {/* 顯示狀態 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show"
            checked={block.show !== false}
            onChange={(e) => setBlock({ ...block, show: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="show" className="ml-2 text-sm font-medium">
            在前端顯示此區塊
          </label>
        </div>
      </div>
    </>
  );
}
