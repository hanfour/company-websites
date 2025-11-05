import AdminNavbar from '@/components/layout/AdminNavbar';
import { getCurrentUser } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // 如果未登入,重定向到登入頁
  if (!user) {
    redirect('/login');
  }

  // 如果已登入,顯示帶導航列的後台布局
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
