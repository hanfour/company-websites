import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import CarouselManager from '@/components/admin/CarouselManager';
import HomeContentManager from '@/components/admin/HomeContentManager';

export default async function AdminHome() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">官網首頁管理</h1>

      {/* 主視覺輪播管理 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">主視覺輪播</h2>
        <CarouselManager />
      </div>

      {/* 首頁內容區塊管理 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">首頁內容區塊</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-700 mb-3">
            新版首頁區塊管理系統已上線！支援：
          </p>
          <ul className="text-sm text-gray-600 list-disc list-inside mb-3 space-y-1">
            <li>自由新增/編輯/刪除區塊</li>
            <li>拖曳調整顯示順序</li>
            <li>支援內容區塊和標題區塊</li>
            <li>自訂圖片位置（左/右）</li>
          </ul>
          <a
            href="/admin/home-blocks"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            前往新版區塊管理 →
          </a>
        </div>
        <HomeContentManager />
      </div>
    </div>
  );
}
