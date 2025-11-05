import Carousel from '@/components/ui/Carousel';
import SeeMoreButton from '@/components/ui/SeeMoreButton';
import { getCompanyData } from '@/app/actions';
import { getImageUrl } from '@/lib/utils/image';
import type { HomeContentItem } from '@/types';

export default async function Home() {
  const company = await getCompanyData();

  const carousel = company?.carousel?.home || [];
  let home = (company?.home || []) as HomeContentItem[];

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  // 篩選顯示的區塊並排序
  home = home
    .filter(block => block.show !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 輪播區塊 */}
      <div className="flex w-full h-[calc(100vh-48px)] md:h-[calc(100vh-72px)]">
        <div className="hidden md:block w-[4.166667%]"></div>
        <div className="flex-1 h-full bg-gray-light">
          {carousel.length > 0 && <Carousel items={carousel} />}
        </div>
        <a
          href="#more"
          className="hidden md:flex w-[4.166667%] flex-col justify-end items-center text-gray-600 no-underline cursor-pointer pb-8"
        >
          <span className="writing-mode-vertical-rl">SCROLL DOWN</span>
          <span className="w-px h-32 bg-gray-400 mt-4"></span>
        </a>
      </div>

      {/* 動態區塊 */}
      {home.map((block, index) => {
        // 標題區塊
        if (block.blockType === 'title') {
          return (
            <div key={block.id || index} className="w-full bg-[#FCFCFC]">
              <div className="w-full max-w-[91.666667%] mx-auto text-center pb-3 md:pb-8 pt-8 md:pt-12">
                <h2 className={`mt-3 md:mt-5 text-2xl md:text-3xl font-light ${block.titleStyle || 'tracking-[0.5em]'}`}>
                  {block.titleText || block.name}
                </h2>
              </div>
            </div>
          );
        }

        // 內容區塊
        const isImageLeft = block.imagePosition === 'left';
        const isOddIndex = index % 2 === 0;
        const bgClass = isOddIndex ? 'bg-[#FCFCFC]' : '';

        // 第一個內容區塊添加 id="more"
        const sectionId = index === 0 ? 'more' : undefined;

        return (
          <div key={block.id || index} id={sectionId} className={`w-full ${bgClass}`}>
            <div className={`flex flex-wrap w-full ${index > 0 && isOddIndex ? 'py-8 md:py-16' : ''} ${!isOddIndex ? 'max-w-[91.666667%] mx-auto py-8 md:py-16' : ''}`}>
              {/* 文字內容 */}
              <div className={`w-full md:w-1/2 order-2 ${isImageLeft ? 'md:order-2' : 'md:order-1'} ${index === 0 ? 'py-8 md:py-16' : ''} flex items-center justify-center`}>
                <div className={`w-full ${index === 0 ? 'max-w-[91.666667%] md:max-w-none md:w-10/12' : 'md:w-10/12'} px-4`}>
                  <div className={`text-content ${index > 0 && isOddIndex ? '' : 'py-4 pb-0 md:pb-0'}`}>
                    <h2 className="text-2xl md:text-3xl">
                      關於<span className="hidden md:inline">・</span>
                      <br className="block md:hidden" />
                      {block.name}
                    </h2>
                    {/* 移動端圖片 */}
                    {(block.src || block.location) && (
                      <div className="w-full h-auto p-0 mx-auto block md:hidden mt-4">
                        <div
                          className="w-full pb-[75%] bg-fluid bg-cover bg-center"
                          style={{ backgroundImage: `url(${getImageUrl(block.src || '', CDN_LINK)})` }}
                        />
                      </div>
                    )}
                    {/* 內容 */}
                    {block.caption && (
                      <div
                        className="prose pt-3 md:pt-5 text-base"
                        dangerouslySetInnerHTML={{ __html: block.caption }}
                      />
                    )}
                  </div>
                  {block.link && <SeeMoreButton href={block.link} />}
                </div>
              </div>

              {/* 桌面端圖片 */}
              {(block.src || block.location) && (
                <div className={`w-full md:w-1/2 order-1 ${isImageLeft ? 'md:order-1' : 'md:order-2'} hidden md:block`}>
                  <div
                    className="w-full h-full min-h-[500px] bg-fluid bg-cover bg-center"
                    style={{ backgroundImage: `url(${getImageUrl(block.src || '', CDN_LINK)})` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
}
