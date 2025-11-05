import { notFound } from 'next/navigation';
import Carousel from '@/components/ui/Carousel';
import { getRentalData } from '@/app/actions';
import type { CarouselItem } from '@/types';
import { getImageUrl } from '@/lib/utils/image';
import { pairCustomFields } from '@/lib/utils/customFieldRenderer';
import { MultiLineField, SingleLineField, PairedLineFields } from '@/components/rental/CustomFieldDisplay';

export default async function RealEstateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rentalData = await getRentalData(id);

  if (!rentalData) {
    notFound();
  }

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  // 使用 slider 作為輪播圖
  const carouselItems: CarouselItem[] = rentalData.slider || [];

  const getTypeLabel = (status: number) => {
    if (status === 0) return '出租';
    if (status === 1) return '出售';
    return '';
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 輪播圖 */}
      <div className="w-full relative" style={{ height: '60vh', minHeight: '400px' }}>
        {carouselItems.length > 0 && <Carousel items={carouselItems} />}

        {/* 類型標籤 - 顯示在輪播圖上 */}
        <div className="absolute top-8 left-8 z-10 bg-[var(--main-color)] text-white px-6 py-2 rounded-full text-base font-medium shadow-lg">
          {getTypeLabel(rentalData.status)}
        </div>
      </div>

      {/* 內容區 */}
      <div className="w-full max-w-[91.666667%] md:max-w-[75%] mx-auto py-8 md:py-16">
        {/* 標題區塊 */}
        <div className="mb-8 md:mb-12 pb-6 border-b border-gray-200">
          <h1 className="text-3xl md:text-4xl font-light mb-4 text-[#2c3e50]">
            {rentalData.name}
          </h1>

          {/* 副標題 */}
          {rentalData.sub && (
            <div
              className="prose text-xl md:text-2xl text-[#6c757d] font-light"
              dangerouslySetInnerHTML={{ __html: rentalData.sub }}
            />
          )}
        </div>

        {/* 主要內容 */}
        {rentalData.caption && (
          <div
            className="prose max-w-none mb-8 text-base md:text-lg leading-relaxed text-[#2c3e50]"
            dangerouslySetInnerHTML={{ __html: rentalData.caption }}
          />
        )}

        {/* 物件詳細資訊 */}
        {(rentalData.price || rentalData.floor || rentalData.application || rentalData.address || rentalData.property || (rentalData.customFields && rentalData.customFields.length > 0)) && (
          <div className="bg-gray-50 rounded-lg p-6 md:p-8 mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#2c3e50]">物件資訊</h3>
            <div className="space-y-4">
              {/* 固定欄位 - 使用 Grid 佈局 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rentalData.price && (
                  <div className="flex">
                    <span className="text-[#6c757d] min-w-[80px]">價格：</span>
                    <span className="text-[#2c3e50] font-medium">{rentalData.price}</span>
                  </div>
                )}
                {rentalData.floor && (
                  <div className="flex">
                    <span className="text-[#6c757d] min-w-[80px]">坪數：</span>
                    <span className="text-[#2c3e50]">{rentalData.floor}</span>
                  </div>
                )}
                {rentalData.application && (
                  <div className="flex">
                    <span className="text-[#6c757d] min-w-[80px]">用途：</span>
                    <span className="text-[#2c3e50]">{rentalData.application}</span>
                  </div>
                )}
                {rentalData.address && (
                  <div className="flex">
                    <span className="text-[#6c757d] min-w-[80px]">地址：</span>
                    <span className="text-[#2c3e50]">{rentalData.address}</span>
                  </div>
                )}
                {rentalData.property && (
                  <div className="flex md:col-span-2">
                    <span className="text-[#6c757d] min-w-[80px]">產權：</span>
                    <span className="text-[#2c3e50]">{rentalData.property}</span>
                  </div>
                )}
              </div>

              {/* 自訂欄位 */}
              {rentalData.customFields && rentalData.customFields.length > 0 &&
                pairCustomFields(rentalData.customFields).map((pair, index) => {
                  if (pair.type === 'multi-line') {
                    return <MultiLineField key={pair.field.id} field={pair.field} />;
                  } else if (pair.type === 'paired-lines') {
                    return <PairedLineFields key={`pair-${pair.fields[0].id}`} fields={pair.fields} />;
                  } else {
                    return <SingleLineField key={pair.field.id} field={pair.field} />;
                  }
                })
              }
            </div>
          </div>
        )}

        {/* 內容區圖片 */}
        {rentalData.src && rentalData.src.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4 text-[#2c3e50]">物件相片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rentalData.src.map((img, index) => {
                const imageUrl = getImageUrl(img, CDN_LINK);
                return (
                  <div key={index} className="w-full pb-[66.67%] bg-gray-200 overflow-hidden rounded-lg relative">
                    <div
                      className="absolute inset-0 bg-cover bg-center hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
