import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import CaseForm from '@/components/admin/CaseForm';

export default async function NewHistoryCase() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">新增歷年個案</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CaseForm type="history" mode="create" />
      </div>
    </div>
  );
}
