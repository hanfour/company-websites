import { notFound } from 'next/navigation';
import Link from 'next/link';
import Carousel from '@/components/ui/Carousel';
import ImageGallery from '@/components/ui/ImageGallery';
import { getCaseData } from '@/app/actions';
import type { CarouselItem } from '@/types';
import type { Metadata } from 'next';

// 生成動態元數據
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const caseData = await getCaseData(id);

  if (!caseData || caseData.type !== 'hot') {
    return {};
  }

  const cleanSubText = caseData.sub ? caseData.sub.replace(/<[^>]*>/g, '').trim() : '';
  const cleanCaption = caseData.caption ? caseData.caption.replace(/<[^>]*>/g, '').trim() : '';
  const description = cleanSubText || cleanCaption || `建林工業 - ${caseData.name}，提供高品質的建築營造服務`;
  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';
  const firstImage = caseData.slider?.[0]?.location || caseData.src?.[0]?.location || `${CDN_LINK}/${caseData.slider?.[0]?.src || caseData.src?.[0]?.src}`;

  return {
    title: caseData.name,
    description: description.slice(0, 160),
    keywords: [caseData.name, '建林工業', '建案', '預售屋', '新成屋', '台北建案', '建築'],
    openGraph: {
      title: `${caseData.name} | 建林工業`,
      description: description.slice(0, 160),
      images: [
        {
          url: firstImage,
          width: 1200,
          height: 630,
          alt: caseData.name,
        },
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${caseData.name} | 建林工業`,
      description: description.slice(0, 160),
      images: [firstImage],
    },
    alternates: {
      canonical: `https://www.jianlin.com.tw/hot/${id}`,
    },
  };
}

export default async function HotDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caseData = await getCaseData(id);

  if (!caseData || caseData.type !== 'hot') {
    notFound();
  }

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  // 使用 slider 数组作为轮播图，带 altText
  const carouselItems: CarouselItem[] = (caseData.slider || []).map((item) => ({
    name: item.altText || caseData.name,
    src: item.src,
    location: item.location || `${CDN_LINK}/${item.src}`,
    altText: item.altText,
  }));

  // 清理 HTML 标签获取纯文本
  const cleanSubText = caseData.sub ? caseData.sub.replace(/<[^>]*>/g, '').trim() : '';

  // JSON-LD 結構化數據 - 房地產列表
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: caseData.name,
    description: cleanSubText || caseData.caption?.replace(/<[^>]*>/g, '').trim() || '',
    url: `https://www.jianlin.com.tw/hot/${caseData.numberID}`,
    image: caseData.slider?.map(img => img.location || `${CDN_LINK}/${img.src}`) || [],
    address: caseData.address ? {
      '@type': 'PostalAddress',
      streetAddress: caseData.address,
      addressLocality: '台北市',
      addressCountry: 'TW',
    } : undefined,
    offers: {
      '@type': 'Offer',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: '建林工業股份有限公司',
      },
    },
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* JSON-LD 結構化數據 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 頂部輪播區塊 - 與 list 相同布局 */}
      <div className="flex w-full h-[calc(100vh-48px)] md:h-[calc(100vh-72px)]">
        <div className="hidden md:block w-[4.166667%]"></div>
        <div className="flex-1 h-full bg-gray-light relative">
          {carouselItems.length > 0 && <Carousel items={carouselItems} showCaption={true} />}
        </div>
        <a
          href="#content"
          className="hidden md:flex w-[4.166667%] flex-col justify-end items-center text-gray-600 no-underline cursor-pointer pb-8"
        >
          <span className="writing-mode-vertical-rl">SCROLL DOWN</span>
          <span className="w-px h-32 bg-gray-400 mt-4"></span>
        </a>
      </div>

      {/* Name + Sub 純文字區塊 */}
      <div id="content" className="w-full bg-[#FCFCFC] py-8 md:py-12">
        <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4 text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-[#000]">{caseData.name}</h1>
          {cleanSubText && (
            <p className="text-base md:text-lg text-[#6c757d] leading-relaxed whitespace-pre-wrap">
              {cleanSubText}
            </p>
          )}
        </div>
      </div>

      {/* 主要內容區塊 - 左邊畫廊 + 右邊資訊 */}
      <div className="w-full py-8 md:py-16">
        <div className="flex flex-wrap w-full">
          {/* 左側 - 圖片畫廊 */}
          <div className="w-full md:w-1/2 order-1 px-4 mb-8 md:mb-0">
            <div className="w-full md:max-w-[90%] mx-auto">
              {caseData.src && caseData.src.length > 0 && (
                <ImageGallery images={caseData.src} projectName={caseData.name} />
              )}
            </div>
          </div>

          {/* 右側 - 內容資訊 */}
          <div className="w-full md:w-1/2 order-2 px-4">
            <div className="w-full md:max-w-[90%]">
              <h2 className="text-xl md:text-2xl font-bold mb-4 text-[#000]">{caseData.name}</h2>

              {/* Caption 內容 */}
              {caseData.caption && (
                <div
                  className="prose text-sm md:text-base text-[#6c757d] leading-loose mb-8"
                  dangerouslySetInnerHTML={{ __html: caseData.caption }}
                />
              )}

              {/* Reservation 按鈕 */}
              <div className="mb-8">
                <Link
                  href={`/reservation/${encodeURIComponent(caseData.name)}`}
                  className="btn-seeMore"
                >
                  <div className="line-horizontal"></div>
                  <span className="text">reservation</span>
                  <span>&gt;</span>
                </Link>
              </div>

              {/* 外部連結按鈕 - 参照原网站样式 */}
              {(caseData.broking || caseData.facebook || caseData.detailed) && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {caseData.facebook && (
                    <a
                      href={caseData.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-6 border-2 border-[#dee2e6] bg-white transition-all hover:border-main hover:bg-main"
                    >
                      <div className="text-4xl mb-3">
                        <svg className="w-10 h-10 fill-current text-[#212529] group-hover:text-white transition-colors" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                      </div>
                      <span className="text-sm text-[#212529] group-hover:text-white transition-colors">個案粉專</span>
                    </a>
                  )}
                  {caseData.broking && (
                    <a
                      href={caseData.broking}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-6 border-2 border-[#dee2e6] bg-white transition-all hover:border-main hover:bg-main"
                    >
                      <div className="text-4xl mb-3">
                        <svg className="w-10 h-10 fill-current text-[#212529] group-hover:text-white transition-colors" viewBox="0 0 24 24">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                        </svg>
                      </div>
                      <span className="text-sm text-[#212529] group-hover:text-white transition-colors">建案詳情</span>
                    </a>
                  )}
                  {caseData.detailed && (
                    <a
                      href={caseData.detailed}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col items-center justify-center p-6 border-2 border-[#dee2e6] bg-white transition-all hover:border-main hover:bg-main"
                    >
                      <div className="text-4xl mb-3">
                        <svg className="w-10 h-10 fill-current text-[#212529] group-hover:text-white transition-colors" viewBox="0 0 24 24">
                          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                        </svg>
                      </div>
                      <span className="text-sm text-[#212529] group-hover:text-white transition-colors">代銷網站</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Google Maps - 滿版寬度 */}
      {caseData.address && (
        <div className="w-full h-[400px] md:h-[500px]">
          <iframe
            src={`https://maps.google.com/maps?q=${encodeURIComponent(caseData.address)}&output=embed`}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      )}

    </div>
  );
}
