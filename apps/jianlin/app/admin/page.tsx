import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';

export default async function AdminIndex() {
  const user = await getCurrentUser();

  // 如果未登入，重定向到登入頁
  if (!user) {
    redirect('/login');
  }

  // 如果已登入，重定向到首頁管理
  redirect('/admin/home');
}
