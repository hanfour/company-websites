import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import RentalForm from '@/components/admin/RentalForm';

export default async function NewRealEstate() {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">新增租售物件</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <RentalForm mode="create" />
      </div>
    </div>
  );
}
