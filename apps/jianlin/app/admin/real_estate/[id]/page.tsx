import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getRentalData } from '@/app/actions';
import RentalForm from '@/components/admin/RentalForm';

export default async function EditRealEstate({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/admin');

  const { id } = await params;
  const rentalData = await getRentalData(id);
  if (!rentalData) {
    redirect('/admin/real_estate_list');
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">編輯租售物件</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <RentalForm initialData={rentalData} mode="edit" />
      </div>
    </div>
  );
}
