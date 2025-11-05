'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCasesData, deleteCaseData } from '@/app/actions';
import type { CaseItem } from '@/types';

export default function AdminHistoryList() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    const data = await getCasesData('history');
    setCases(data);
    setLoading(false);
  };

  const handleDelete = async (numberID: string) => {
    if (confirm('確定要刪除此個案嗎？')) {
      await deleteCaseData(numberID);
      loadCases();
    }
  };

  if (loading) {
    return <div>載入中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">歷年個案管理</h1>
        <Link
          href="/admin/history/new"
          className="px-4 py-2 bg-[var(--main-color)] text-white rounded-lg hover:bg-opacity-90 transition-colors"
        >
          新增個案
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                標題
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                副標題
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases && cases.length > 0 ? (
              cases.map((caseItem) => {
                const subtitle = caseItem.sub ? caseItem.sub.replace(/<[^>]*>/g, '').trim() : '-';
                return (
                <tr key={caseItem.numberID}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{caseItem.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{subtitle}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/admin/history/${caseItem.numberID}`}
                      className="text-[var(--main-color)] hover:text-opacity-80 mr-4"
                    >
                      編輯
                    </Link>
                    <button
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDelete(caseItem.numberID)}
                    >
                      刪除
                    </button>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  目前沒有歷年個案
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
