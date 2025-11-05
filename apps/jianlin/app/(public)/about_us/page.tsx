import { getCompanyData } from '@/app/actions';
import { metadata as pageMetadata } from './metadata';
import type { AboutItem } from '@/types';
import Image from 'next/image';

export const metadata = pageMetadata;

export default async function AboutUs() {
  const company = await getCompanyData();
  let aboutData = (company?.about || []) as AboutItem[];

  // 篩選顯示的區塊並排序
  aboutData = aboutData
    .filter(block => block.show !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const CDN_LINK = process.env.NEXT_PUBLIC_CDN_LINK || '';

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 頁面標題 */}
      <div className="w-full text-center py-8 md:py-16">
        <h2 className="text-2xl md:text-3xl font-light tracking-wider text-[#333]">關於・建林工業股份有限公司</h2>
      </div>

      {/* 動態內容區塊 */}
      <div className="w-full pb-8 md:pb-16">
        {aboutData.map((item, index) => {
          const imageSrc = item.location || (item.src ? `${CDN_LINK}${item.src}` : '');
          const layoutTemplate = item.layoutTemplate || 'text-only';

          return (
            <div key={item.id || index} className="mb-8 md:mb-12">
              {/* 純文字佈局 */}
              {layoutTemplate === 'text-only' && (
                <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4">
                  {item.title && (
                    <div className="w-full border-b border-[#dee2e6] pb-2 mb-4">
                      <h5 className="text-base md:text-lg font-bold text-[#000]">{item.title}</h5>
                    </div>
                  )}
                  {item.caption && (
                    <div
                      className="prose text-sm md:text-base text-[#6c757d] leading-loose"
                      dangerouslySetInnerHTML={{ __html: item.caption }}
                    />
                  )}
                </div>
              )}

              {/* 上圖下文佈局 */}
              {layoutTemplate === 'text-with-top-image' && (
                <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4">
                  {item.title && (
                    <div className="w-full border-b border-[#dee2e6] pb-2 mb-4">
                      <h5 className="text-base md:text-lg font-bold text-[#000]">{item.title}</h5>
                    </div>
                  )}
                  {imageSrc && (
                    <div className="w-full mb-6">
                      <Image
                        src={imageSrc}
                        alt={item.title || '關於建林圖片'}
                        width={1200}
                        height={600}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                  {item.caption && (
                    <div
                      className="prose text-sm md:text-base text-[#6c757d] leading-loose mt-4"
                      dangerouslySetInnerHTML={{ __html: item.caption }}
                    />
                  )}
                </div>
              )}

              {/* 左圖右文佈局 */}
              {layoutTemplate === 'text-with-left-image' && (
                <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    {imageSrc && (
                      <div className="md:w-1/3 flex-shrink-0">
                        <Image
                          src={imageSrc}
                          alt={item.title || '關於建林圖片'}
                          width={400}
                          height={400}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {item.title && (
                        <div className="w-full border-b border-[#dee2e6] pb-2">
                          <h5 className="text-base md:text-lg font-bold text-[#000]">{item.title}</h5>
                        </div>
                      )}
                      {item.caption && (
                        <div
                          className="prose text-sm md:text-base text-[#6c757d] leading-loose mt-4"
                          dangerouslySetInnerHTML={{ __html: item.caption }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 右圖左文佈局 */}
              {layoutTemplate === 'text-with-right-image' && (
                <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4">
                  <div className="flex flex-col md:flex-row-reverse gap-6">
                    {imageSrc && (
                      <div className="md:w-1/3 flex-shrink-0">
                        <Image
                          src={imageSrc}
                          alt={item.title || '關於建林圖片'}
                          width={400}
                          height={400}
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {item.title && (
                        <div className="w-full border-b border-[#dee2e6] pb-2">
                          <h5 className="text-base md:text-lg font-bold text-[#000]">{item.title}</h5>
                        </div>
                      )}
                      {item.caption && (
                        <div
                          className="prose text-sm md:text-base text-[#6c757d] leading-loose mt-4"
                          dangerouslySetInnerHTML={{ __html: item.caption }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 純圖片佈局 */}
              {layoutTemplate === 'image-only' && (
                <div className="w-full md:max-w-[83.333333%] lg:max-w-[66.666667%] mx-auto px-4">
                  {item.title && (
                    <div className="w-full border-b border-[#dee2e6] pb-2 mb-4">
                      <h5 className="text-base md:text-lg font-bold text-[#000]">{item.title}</h5>
                    </div>
                  )}
                  {imageSrc && (
                    <div className="w-full">
                      <Image
                        src={imageSrc}
                        alt={item.title || '關於建林圖片'}
                        width={1200}
                        height={800}
                        className="w-full h-auto rounded-lg"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
