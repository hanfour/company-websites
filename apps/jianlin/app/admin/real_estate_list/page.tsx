'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getRentalsData, deleteRentalData } from '@/app/actions';
import type { RentalItem } from '@/types';

export default function AdminRealEstateList() {
  const router = useRouter();
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRentals();
  }, []);

  const loadRentals = async () => {
    const data = await getRentalsData();
    setRentals(data);
    setLoading(false);
  };

  const handleDelete = async (numberID: string) => {
    if (confirm('確定要刪除此物件嗎？')) {
      await deleteRentalData(numberID);
      loadRentals();
    }
  };

  if (loading) {
    return <div>載入中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">不動產租售管理</h1>
        <Link
          href="/admin/real_estate/new"
          className="px-4 py-2 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          新增物件
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                物件名稱
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                類型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                價格
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                狀態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rentals && rentals.length > 0 ? (
              rentals.map((rental) => (
                <tr key={rental.numberID}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{rental.name}</div>
                    {rental.sub && (
                      <div
                        className="text-sm text-gray-500 mt-1 line-clamp-1"
                        dangerouslySetInnerHTML={{ __html: rental.sub }}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rental.status === 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {rental.status === 0 ? '出租' : '出售'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{rental.price || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rental.show !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {rental.show !== false ? '顯示' : '隱藏'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/real_estate/${rental.numberID}`}
                      className="text-[var(--main-color)] hover:text-opacity-80 mr-4"
                    >
                      編輯
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(rental.numberID)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                  目前沒有租售物件
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
