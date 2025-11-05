import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import AboutManager from '@/components/admin/AboutManager';

export default async function AdminAbout() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">關於建林管理</h1>

      {/* 新版區塊管理系統提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 mb-3">
          新版關於建林區塊管理系統已上線！支援：
        </p>
        <ul className="text-sm text-gray-600 list-disc list-inside mb-3 space-y-1">
          <li>自由新增/編輯/刪除區塊</li>
          <li>拖曳調整顯示順序</li>
          <li>5 種佈局模板：純文字、上圖下文、左圖右文、右圖左文、純圖片</li>
          <li>圖片上傳和管理</li>
        </ul>
        <a
          href="/admin/about-blocks"
          className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          前往新版區塊管理 →
        </a>
      </div>

      <AboutManager />
    </div>
  );
}
