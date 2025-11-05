import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getCaseData } from '@/app/actions';
import CaseForm from '@/components/admin/CaseForm';

export default async function EditHotCase({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  const { id } = await params;
  const caseData = await getCaseData(id);
  if (!caseData) {
    redirect('/admin/hot_list');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">編輯熱銷個案</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <CaseForm initialData={caseData} type="hot" mode="edit" />
      </div>
    </div>
  );
}
