'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/ui/RichTextEditor';
import MultiImageUploader from '@/components/admin/MultiImageUploader';
import type { HomeContentItem, ImageItem } from '@/types';

interface HomeBlockEditFormProps {
  blockId: string;
  initialBlock: Partial<HomeContentItem>;
  allBlocks: any[];
}

export default function HomeBlockEditForm({ blockId, initialBlock, allBlocks }: HomeBlockEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [block, setBlock] = useState<Partial<HomeContentItem>>(initialBlock);
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (initialBlock.src || initialBlock.location) {
      return [{
        name: initialBlock.name || 'image',
        src: initialBlock.src || '',
        location: initialBlock.location || '',
      }];
    }
    return [];
  });

  async function handleSave() {
    if (!block.name) {
      alert('請輸入標題');
      return;
    }

    if (block.blockType === 'content' && !block.caption) {
      alert('請輸入內容');
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
      const saveRes = await fetch('/api/admin/home-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ home: newBlocks }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save');
      }

      alert('儲存成功！');
      router.push('/admin/home-blocks');
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
          {blockId.startsWith('block_') && !blockId.includes('item') ? '新增' : '編輯'}首頁區塊
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
        {/* 區塊類型選擇 */}
        <div>
          <label className="block text-sm font-medium mb-2">區塊類型</label>
          <select
            value={block.blockType}
            onChange={(e) => setBlock({ ...block, blockType: e.target.value as 'content' | 'title' })}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="content">內容區塊（包含標題、內容、圖片）</option>
            <option value="title">標題區塊（僅大標題）</option>
          </select>
        </div>

        {/* 標題 */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {block.blockType === 'content' ? '標題' : '標題文字'}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={block.blockType === 'content' ? (block.name || '') : (block.titleText || '')}
            onChange={(e) => {
              if (block.blockType === 'content') {
                setBlock({ ...block, name: e.target.value });
              } else {
                setBlock({ ...block, titleText: e.target.value, name: e.target.value });
              }
            }}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder={block.blockType === 'content' ? '例如：建林工業股份有限公司' : '例如：歷・年・個・案'}
          />
        </div>

        {/* 內容區塊特有欄位 */}
        {block.blockType === 'content' && (
          <>
            {/* 富文本內容 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                內容<span className="text-red-500">*</span>
              </label>
              <RichTextEditor
                value={block.caption || ''}
                onChange={(value) => setBlock({ ...block, caption: value })}
              />
            </div>

            {/* 圖片 */}
            <div>
              <label className="block text-sm font-medium mb-2">圖片</label>
              <MultiImageUploader
                images={images}
                onChange={setImages}
                maxImages={1}
              />
            </div>

            {/* 圖片位置 */}
            <div>
              <label className="block text-sm font-medium mb-2">圖片位置</label>
              <select
                value={block.imagePosition}
                onChange={(e) => setBlock({ ...block, imagePosition: e.target.value as 'left' | 'right' })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="left">左側</option>
                <option value="right">右側</option>
              </select>
            </div>

            {/* 連結 */}
            <div>
              <label className="block text-sm font-medium mb-2">連結</label>
              <input
                type="text"
                value={block.link || ''}
                onChange={(e) => setBlock({ ...block, link: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="例如：/about_us 或 /hot/hot001"
              />
            </div>
          </>
        )}

        {/* 標題區塊特有欄位 */}
        {block.blockType === 'title' && (
          <div>
            <label className="block text-sm font-medium mb-2">標題樣式</label>
            <input
              type="text"
              value={block.titleStyle || ''}
              onChange={(e) => setBlock({ ...block, titleStyle: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="CSS class（選填）"
            />
            <p className="text-xs text-gray-500 mt-1">
              例如：tracking-[0.5em] 可增加字距
            </p>
          </div>
        )}

        {/* 顯示狀態 */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="show"
            checked={block.show}
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
