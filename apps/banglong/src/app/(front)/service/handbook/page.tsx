import { unstable_cache } from 'next/cache';
import Breadcrumb from '@/components/front/Breadcrumb';
import WelcomeMessage from '@/components/front/WelcomeMessage';
import { HandbookPublic } from '@/types/handbook';
import { getStorage } from '@/lib/storage';
import Link from 'next/link';
import Image from 'next/image';

// 獲取手冊數據，60 秒緩存
const getHandbooks = unstable_cache(
  async (): Promise<HandbookPublic[]> => {
    try {
      const storage = getStorage();
      const handbooks = await storage.handbook.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });

      // 查詢關聯數據並排除密碼
      const handbooksPublic = await Promise.all(
        handbooks.map(async (handbook) => {
          let projectData = null;
          if (handbook.projectId) {
            const project = await storage.project.findUnique(handbook.projectId);
            if (project) {
              projectData = { id: project.id, title: project.title };
            }
          }

          return {
            id: handbook.id,
            title: handbook.title,
            coverImageUrl: handbook.coverImageUrl,
            description: handbook.description,
            order: handbook.order,
            projectId: handbook.projectId,
            project: projectData
          } as HandbookPublic;
        })
      );

      return handbooksPublic;
    } catch (error) {
      console.error('Error fetching handbooks:', error);
      return [];
    }
  },
  ['handbooks'],
  { revalidate: 60, tags: ['handbooks'] }
);

// 內聯的 HandbookCard（支持 Link）
function HandbookCardLink({ handbook }: { handbook: HandbookPublic }) {
  return (
    <Link
      href={`/service/handbook/${handbook.id}`}
      className="cursor-pointer transition-all duration-300 hover:scale-105 group block"
    >
      {/* 封面圖片 */}
      <div className="relative w-full pt-[142%] bg-gray-200 overflow-hidden">
        <Image
          src={handbook.coverImageUrl}
          alt={handbook.title}
          fill
          className="object-cover group-hover:brightness-95 transition-all"
        />
      </div>

      {/* 標題 */}
      <h3 className="text-center text-black text-sm md:text-base lg:text-lg font-medium mt-3 md:mt-4 group-hover:text-[#a48b78] transition-colors">
        {handbook.title}︱交屋手冊
      </h3>

      {/* 專案標籤 */}
      {handbook.project && (
        <p className="text-center text-xs md:text-sm text-gray-500 mt-1">
          {handbook.project.title}
        </p>
      )}
    </Link>
  );
}

export default async function HandbookPage() {
  const handbooks = await getHandbooks();

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] lg:min-h-[calc(100vh-220px)]">
      {/* 手機版麵包屑 */}
      <div className="lg:hidden w-full mb-4">
        <Breadcrumb
          parentTitle="尊榮售服"
          parentTitleEn="SERVICE"
          currentTitle="交屋手冊"
          parentPath="/service"
          parentIsClickable={false}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between w-full">
        {/* 桌面版麵包屑 */}
        <div className="hidden lg:block mb-8 lg:mb-0">
          <Breadcrumb
            parentTitle="尊榮售服"
            parentTitleEn="SERVICE"
            currentTitle="交屋手冊"
            parentPath="/service"
            parentIsClickable={false}
          />
        </div>

        {/* 右側內容 */}
        <div className="w-full lg:flex-1 lg:pl-8 pb-12">
          <WelcomeMessage />

          {handbooks.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
              <p className="text-gray-500">目前尚無交屋手冊</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10">
              {handbooks.map((handbook) => (
                <HandbookCardLink key={handbook.id} handbook={handbook} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
