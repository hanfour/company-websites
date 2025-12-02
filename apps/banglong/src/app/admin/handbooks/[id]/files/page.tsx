'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileUploadDropZone } from '@/components/FileUploadDropZone';
import { Loader2, Upload, Edit, Trash2, File, FileText, Eye, X, Check } from 'lucide-react';

interface HandbookFile {
  id: string;
  title: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number | null;
  order: number;
  downloadCount: number;
}

export default function HandbookFilesPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const handbookId = params.id as string;

  const [files, setFiles] = useState<HandbookFile[]>([]);
  const [handbookTitle, setHandbookTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    if (status === 'authenticated') {
      fetchFiles();
      fetchHandbook();
    }
  }, [status, router]);

  const fetchHandbook = async () => {
    try {
      const response = await fetch(`/api/handbooks/${handbookId}`);
      const data = await response.json();
      setHandbookTitle(data.handbook?.title || '');
    } catch (err) {
      console.error('獲取手冊失敗:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/handbooks/${handbookId}/files`);
      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('獲取文件列表失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilesUploaded = async (
    results: Array<{ url: string | null; fileName: string; fileSize: number }>
  ) => {
    const successErrors: string[] = [];

    for (const result of results) {
      if (!result.url) {
        successErrors.push(`文件 ${result.fileName} 上傳失敗`);
        continue;
      }

      try {
        const fileType = result.fileName.split('.').pop() || 'unknown';

        // 建立文件記錄，使用真實的文件名和文件大小
        const createResponse = await fetch(`/api/handbooks/admin/${handbookId}/files`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: result.fileName,
            fileUrl: result.url,
            fileType,
            fileSize: result.fileSize,
            order: files.length,
          }),
        });

        if (!createResponse.ok) {
          successErrors.push(`創建 ${result.fileName} 的文件記錄失敗`);
          continue;
        }
      } catch (err) {
        successErrors.push(`創建 ${result.fileName} 的文件記錄失敗`);
      }
    }

    if (successErrors.length > 0) {
      setUploadErrors(successErrors);
      setTimeout(() => setUploadErrors([]), 5000);
    }

    fetchFiles();
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('確定要刪除此文件嗎?')) return;

    try {
      const response = await fetch(`/api/handbooks/admin/${handbookId}/files/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('刪除失敗');
      }

      fetchFiles();
    } catch (err) {
      alert('刪除失敗');
    }
  };

  const startEdit = (file: HandbookFile) => {
    setEditingFileId(file.id);
    setEditingTitle(file.title);
  };

  const cancelEdit = () => {
    setEditingFileId(null);
    setEditingTitle('');
  };

  const saveEdit = async (fileId: string) => {
    try {
      const response = await fetch(`/api/handbooks/admin/${handbookId}/files/${fileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editingTitle }),
      });

      if (!response.ok) {
        throw new Error('更新失敗');
      }

      setEditingFileId(null);
      setEditingTitle('');
      fetchFiles();
    } catch (err) {
      alert('更新文件名失敗');
    }
  };

  const handlePreview = (fileUrl: string) => {
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type === 'pdf') return <File className="h-6 w-6 text-red-600" />;
    if (type === 'doc' || type === 'docx') return <FileText className="h-6 w-6 text-blue-600" />;
    return <File className="h-6 w-6 text-gray-600" />;
  };

  if (status === 'loading' || isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-amber-800" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/handbooks')}
          className="text-amber-800 hover:underline mb-2"
        >
          ← 返回手冊列表
        </button>
        <h1 className="text-2xl font-bold">文件管理: {handbookTitle}</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">上傳文件</h2>
        <FileUploadDropZone
          onFilesUploaded={handleFilesUploaded}
          acceptedTypes={['.pdf', '.doc', '.docx', '.ppt', '.pptx']}
          multiple={true}
        />

        {uploadErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-2">上傳警告：</div>
            <ul className="space-y-1 text-sm text-red-600">
              {uploadErrors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                類型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                文件名稱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                大小
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                下載次數
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{getFileIcon(file.fileType)}</td>
                <td className="px-6 py-4">
                  {editingFileId === file.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1 flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEdit(file.id)}
                        className="text-green-600 hover:text-green-900"
                        title="保存"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-900"
                        title="取消"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="text-sm font-medium text-gray-900">{file.title}</div>
                      <div className="text-sm text-gray-500">{file.fileType.toUpperCase()}</div>
                    </>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{formatFileSize(file.fileSize)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">{file.downloadCount} 次</div>
                </td>
                <td className="px-6 py-4 text-sm font-medium">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePreview(file.fileUrl)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                      title="預覽"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      預覽
                    </button>
                    <button
                      onClick={() => startEdit(file)}
                      className="text-amber-600 hover:text-amber-900 inline-flex items-center"
                      title="編輯"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center"
                      title="刪除"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      刪除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {files.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            尚無文件,請上傳文件
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
