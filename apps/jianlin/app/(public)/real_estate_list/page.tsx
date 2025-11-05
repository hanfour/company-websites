'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/image';
import type { RentalItem } from '@/types';

export default function RealEstateList() {
  const [rentals, setRentals] = useState<RentalItem[]>([]);
  const [filteredRentals, setFilteredRentals] = useState<RentalItem[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 0 | 1>('all');
  const [loading, setLoading] = useState(true);

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  useEffect(() => {
    // 從 API 載入資料
    fetch('/api/rentals')
      .then((res) => res.json())
      .then((data) => {
        // 只顯示 show: true 的項目
        const visibleRentals = (data.rentals || []).filter((r: RentalItem) => r.show !== false);
        setRentals(visibleRentals);
        setFilteredRentals(visibleRentals);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load rentals:', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // 根據類型篩選 (status: 0=出租, 1=出售)
    if (selectedType === 'all') {
      setFilteredRentals(rentals);
    } else {
      setFilteredRentals(rentals.filter((rental) => rental.status === selectedType));
    }
  }, [selectedType, rentals]);

  const getTypeLabel = (status: number) => {
    if (status === 0) return '出租';
    if (status === 1) return '出售';
    return '';
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 頁面標題 */}
      <div className="w-full text-center py-8 md:py-16">
        <h1 className="text-3xl md:text-4xl font-light tracking-widest text-[#6c757d]">
          不動產租售
        </h1>
      </div>

      {/* 篩選器 */}
      <div className="w-full max-w-[91.666667%] mx-auto mb-8">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              selectedType === 'all'
                ? 'bg-[var(--main-color)] text-white'
                : 'bg-white text-[#6c757d] border border-gray-300 hover:border-[var(--main-color)]'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setSelectedType(0)}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              selectedType === 0
                ? 'bg-[var(--main-color)] text-white'
                : 'bg-white text-[#6c757d] border border-gray-300 hover:border-[var(--main-color)]'
            }`}
          >
            出租一覽
          </button>
          <button
            onClick={() => setSelectedType(1)}
            className={`px-6 py-2 rounded-full transition-all duration-300 ${
              selectedType === 1
                ? 'bg-[var(--main-color)] text-white'
                : 'bg-white text-[#6c757d] border border-gray-300 hover:border-[var(--main-color)]'
            }`}
          >
            出售一覽
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="w-full max-w-[91.666667%] mx-auto pb-8 md:pb-16">
        {loading ? (
          <div className="w-full text-center py-20">
            <p className="text-[#6c757d] text-lg">載入中...</p>
          </div>
        ) : filteredRentals && filteredRentals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredRentals.map((rental) => {
              // 優先使用 slider，再用 src
              const images = rental.slider?.length > 0 ? rental.slider : rental.src;
              const firstImage = images && images.length > 0 ? images[0] : null;
              const imageUrl = firstImage
                ? getImageUrl(firstImage, CDN_LINK)
                : '/demo/img-md.jpg';

              return (
                <Link
                  key={rental.numberID}
                  href={`/real_estate/${rental.numberID}`}
                  className="group block bg-white shadow-md rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* 圖片 */}
                  <div className="w-full pb-[66.67%] bg-gray-200 overflow-hidden relative">
                    <div
                      className="absolute inset-0 bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                    {/* 類型標籤 */}
                    <div className="absolute top-4 left-4 bg-[var(--main-color)] text-white px-4 py-1 rounded-full text-sm font-medium">
                      {getTypeLabel(rental.status)}
                    </div>
                  </div>

                  {/* 文字內容 */}
                  <div className="p-5 md:p-6">
                    <h3 className="text-lg md:text-xl font-medium mb-2 text-[#000] group-hover:text-[var(--main-color)] transition-colors line-clamp-2">
                      {rental.name}
                    </h3>
                    {rental.sub && (
                      <div
                        className="prose text-[#6c757d] text-sm line-clamp-2"
                        dangerouslySetInnerHTML={{ __html: rental.sub }}
                      />
                    )}

                    {/* 查看詳情按鈕 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <span className="text-[var(--main-color)] text-sm font-medium group-hover:underline inline-flex items-center">
                        查看詳情
                        <svg
                          className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="w-full text-center py-20">
            <p className="text-[#6c757d] text-lg">
              {selectedType === 'all'
                ? '目前沒有不動產租售資訊'
                : selectedType === 0
                ? '目前沒有出租物件'
                : '目前沒有出售物件'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
