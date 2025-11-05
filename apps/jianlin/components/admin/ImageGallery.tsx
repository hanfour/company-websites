'use client';

import { useState, useEffect } from 'react';

interface ImageItem {
  key: string;
  url: string;
  lastModified: string;
  size: number;
}

interface ImageGalleryProps {
  onSelectImage: (url: string, key: string) => void;
  onClose: () => void;
  currentImageKey?: string;
}

export default function ImageGallery({
  onSelectImage,
  onClose,
  currentImageKey,
}: ImageGalleryProps) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedKey, setSelectedKey] = useState<string>(currentImageKey || '');
  const [deleteConfirm, setDeleteConfirm] = useState<string>('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/admin/upload/list');
      if (!response.ok) {
        throw new Error('獲取圖片列表失敗');
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : '獲取圖片列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (deleteConfirm !== key) {
      setDeleteConfirm(key);
      setTimeout(() => setDeleteConfirm(''), 3000);
      return;
    }

    try {
      const response = await fetch('/api/admin/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error('刪除圖片失敗');
      }

      // 重新獲取圖片列表
      await fetchImages();
      setDeleteConfirm('');
    } catch (err) {
      console.error('Error deleting image:', err);
      alert(err instanceof Error ? err.message : '刪除圖片失敗');
    }
  };

  const handleSelect = () => {
    const selected = images.find((img) => img.key === selectedKey);
    if (selected) {
      onSelectImage(selected.url, selected.key);
      onClose();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* 頭部 */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">圖片庫</h3>
            <p className="text-sm text-gray-600 mt-1">
              選擇已上傳的圖片或上傳新圖片
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="關閉"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 內容區域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">載入中...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {!loading && !error && images.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p>尚無上傳的圖片</p>
            </div>
          )}

          {!loading && !error && images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image.key}
                  className={`
                    relative group border-2 rounded-lg overflow-hidden cursor-pointer transition-all
                    ${selectedKey === image.key ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'}
                  `}
                  onClick={() => setSelectedKey(image.key)}
                >
                  {/* 圖片預覽 */}
                  <div className="aspect-video bg-gray-100 relative">
                    <img
                      src={image.url}
                      alt={image.key}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />

                    {/* 選中標記 */}
                    {selectedKey === image.key && (
                      <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}

                    {/* 刪除按鈕 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.key);
                      }}
                      className="absolute top-2 left-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title={deleteConfirm === image.key ? '再次點擊確認刪除' : '刪除圖片'}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* 圖片信息 */}
                  <div className="p-2 bg-white">
                    <p className="text-xs text-gray-600 truncate" title={image.key}>
                      {image.key.split('/').pop()}
                    </p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">{formatFileSize(image.size)}</span>
                      <span className="text-xs text-gray-500">{formatDate(image.lastModified)}</span>
                    </div>
                  </div>

                  {deleteConfirm === image.key && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center">
                      <p className="text-white font-medium text-sm">再次點擊確認刪除</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <button
            onClick={fetchImages}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重新整理
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedKey}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              選擇圖片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
