import Carousel from '@/components/ui/Carousel';
import SeeMoreButton from '@/components/ui/SeeMoreButton';
import { getCasesData, getCompanyData } from '@/app/actions';
import Link from 'next/link';
import { metadata as pageMetadata } from './metadata';

export const metadata = pageMetadata;

export default async function HotList() {
  const cases = await getCasesData('hot');
  const company = await getCompanyData();

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  // 将项目的第一张 slider 图片转换为轮播数据
  const carouselItems = cases.map(caseItem => {
    const firstSlider = caseItem.slider?.[0];
    return {
      name: caseItem.name,
      src: firstSlider?.src || '',
      location: firstSlider?.location || '',
      altText: firstSlider?.altText || caseItem.name,
      link: `/hot/${caseItem.numberID}`,
      caption: caseItem.name
    };
  }).filter(item => item.location || item.src);

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 輪播區塊 */}
      <div className="flex w-full h-[calc(100vh-48px)] md:h-[calc(100vh-72px)]">
        <div className="hidden md:block w-[4.166667%]"></div>
        <div className="flex-1 h-full bg-gray-light relative">
          {carouselItems.length > 0 && <Carousel items={carouselItems} showSeeMore={true} />}
        </div>
        <a
          href="#cases"
          className="hidden md:flex w-[4.166667%] flex-col justify-end items-center text-gray-600 no-underline cursor-pointer pb-8"
        >
          <span className="writing-mode-vertical-rl">SCROLL DOWN</span>
          <span className="w-px h-32 bg-gray-400 mt-4"></span>
        </a>
      </div>

      {/* 個案列表標題 */}
      <div className="w-full bg-[#FCFCFC]">
        <div className="w-full max-w-[91.666667%] mx-auto text-center pb-3 md:pb-8 pt-8 md:pt-12">
          <h2 className="mt-3 md:mt-5 text-2xl md:text-3xl font-light tracking-[0.5em]">熱・銷・個・案</h2>
        </div>
      </div>

      {/* 個案列表區塊 */}
      <div id="cases" className="w-full bg-[#FCFCFC]">
        {cases && cases.length > 0 ? (
          cases.map((caseItem, index) => {
            const isOdd = index % 2 === 0;
            const firstImage = caseItem.slider?.[0] || caseItem.src?.[0];
            const imageUrl = firstImage
              ? (firstImage.location || `${CDN_LINK}/${firstImage.src}`)
              : '/demo/img-md.jpg';

            const content = caseItem.outline || '';

            return (
              <div key={caseItem.numberID} className="w-full">
                <div className="flex flex-wrap w-full">
                  {/* 內容區塊 */}
                  <div className={`w-full md:w-1/2 ${isOdd ? 'order-2 md:order-1' : 'order-2 md:order-2'} py-8 md:py-16 flex items-center justify-center`}>
                    <div className="w-full max-w-[91.666667%] md:max-w-none md:w-10/12 px-4">
                      <div className="text-content">
                        <h2 className="text-2xl md:text-3xl mb-4">{caseItem.name}</h2>
                        {/* 移动端图片 */}
                        <div className="w-full h-auto p-0 mx-auto block md:hidden mt-4">
                          <div
                            className="w-full pb-[75%] bg-fluid bg-cover bg-center"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                          />
                        </div>
                        {/* 内容区域 */}
                        <div
                          className="prose pt-3 md:pt-5 text-base text-[#6c757d] leading-loose"
                          dangerouslySetInnerHTML={{ __html: content }}
                        />
                      </div>
                      <SeeMoreButton href={`/hot/${caseItem.numberID}`} />
                    </div>
                  </div>
                  {/* 圖片區塊 */}
                  <div className={`w-full md:w-1/2 ${isOdd ? 'order-1 md:order-2' : 'order-1 md:order-1'} hidden md:block`}>
                    <div
                      className="w-full h-full min-h-[500px] bg-fluid bg-cover bg-center"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="w-full text-center py-20">
            <p className="text-[#6c757d] text-lg">目前沒有熱銷個案</p>
          </div>
        )}
      </div>

    </div>
  );
}
