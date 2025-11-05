import Link from 'next/link';
import type { CaseItem } from '@/types';

interface CaseListProps {
  cases: CaseItem[];
  type: 'hot' | 'history';
}

export default function CaseList({ cases, type }: CaseListProps) {
  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';
  const baseUrl = type === 'hot' ? '/hot' : '/history';

  if (!cases || cases.length === 0) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-[#6c757d] text-lg">目前沒有{type === 'hot' ? '熱銷' : '歷年'}個案</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {cases.map((caseItem) => {
        // 优先使用 slider 第一张图，如果没有则使用 src 第一张图
        const firstImage = caseItem.slider?.[0] || caseItem.src?.[0];
        const imageUrl = firstImage
          ? (firstImage.location || `${CDN_LINK}/${firstImage.src}`)
          : '/demo/img-md.jpg';

        // 清理 HTML 标签显示纯文本
        const subtitle = caseItem.sub
          ? caseItem.sub.replace(/<[^>]*>/g, '').trim()
          : '';

        return (
          <Link
            key={caseItem.numberID}
            href={`${baseUrl}/${caseItem.numberID}`}
            className="group block hover-bg overflow-hidden transition-all duration-300"
          >
            {/* 圖片 */}
            <div className="w-full pb-[75%] bg-gray-light overflow-hidden relative">
              <div
                className="absolute inset-0 bg-fluid bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url(${imageUrl})` }}
              />
            </div>

            {/* 文字內容 */}
            <div className="p-5 md:p-6">
              <h3 className="text-lg md:text-xl font-medium mb-2 text-[#000] group-hover:text-white transition-colors">
                {caseItem.name}
              </h3>
              {subtitle && (
                <p className="text-[#6c757d] text-sm group-hover:text-white transition-colors">
                  {subtitle}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
