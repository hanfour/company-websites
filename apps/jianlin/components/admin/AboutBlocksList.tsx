'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AboutItem } from '@/types';

interface AboutBlocksListProps {
  initialBlocks: AboutItem[];
}

const layoutTemplateLabels: Record<string, string> = {
  'text-only': '純文字',
  'text-with-top-image': '上圖下文',
  'text-with-left-image': '左圖右文',
  'text-with-right-image': '右圖左文',
  'image-only': '純圖片',
};

export default function AboutBlocksList({ initialBlocks }: AboutBlocksListProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [blocks, setBlocks] = useState<AboutItem[]>(initialBlocks);

  async function handleSave() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/about-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ about: blocks }),
      });

      if (!res.ok) {
        throw new Error('Failed to save');
      }

      alert('儲存成功！');
      router.refresh();
    } catch (error) {
      console.error('Failed to save:', error);
      alert('儲存失敗');
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    const newBlock: AboutItem = {
      id: `block_${Date.now()}`,
      order: blocks.length,
      show: true,
      title: '新區塊',
      caption: '<p>內容...</p>',
      layoutTemplate: 'text-only',
    };
    setBlocks([...blocks, newBlock]);
  }

  function handleDelete(id: string) {
    if (!confirm('確定要刪除此區塊嗎？')) return;
    setBlocks(blocks.filter(b => b.id !== id));
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index - 1]] = [newBlocks[index - 1], newBlocks[index]];
    newBlocks.forEach((block, i) => block.order = i);
    setBlocks(newBlocks);
  }

  function handleMoveDown(index: number) {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
    newBlocks.forEach((block, i) => block.order = i);
    setBlocks(newBlocks);
  }

  function handleEdit(id: string) {
    router.push(`/admin/about-blocks/edit/${id}`);
  }

  function handleToggleShow(id: string) {
    setBlocks(blocks.map(b =>
      b.id === id ? { ...b, show: !b.show } : b
    ));
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">關於建林區塊管理</h1>
        <div className="space-x-2">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            + 新增區塊
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? '儲存中...' : '儲存所有變更'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {blocks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            尚無區塊，請點擊「新增區塊」開始
          </div>
        ) : (
          <div className="divide-y">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className={`p-4 ${!block.show ? 'bg-gray-50 opacity-60' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* 排序按鈕 */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === blocks.length - 1}
                      className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  {/* 區塊資訊 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {layoutTemplateLabels[block.layoutTemplate] || block.layoutTemplate}
                      </span>
                      <span className="font-medium text-lg">{block.title}</span>
                      {!block.show && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          已隱藏
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {block.caption && (
                        <div className="line-clamp-2">
                          內容：{block.caption.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </div>
                      )}
                      {block.src && <div>圖片：{block.src}</div>}
                    </div>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleToggleShow(block.id)}
                      className={`px-3 py-1 text-sm rounded ${
                        block.show
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {block.show ? '隱藏' : '顯示'}
                    </button>
                    <button
                      onClick={() => handleEdit(block.id)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(block.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>提示：</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>使用 ↑ ↓ 按鈕調整區塊顯示順序</li>
          <li>支援 5 種佈局模板：純文字、上圖下文、左圖右文、右圖左文、純圖片</li>
          <li>隱藏的區塊不會在前端顯示</li>
          <li>修改完成後記得點擊「儲存所有變更」</li>
        </ul>
      </div>
    </>
  );
}
