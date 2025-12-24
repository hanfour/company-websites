import { unstable_cache } from 'next/cache';
import Breadcrumb from '@/components/front/Breadcrumb';
import { Project } from '@/types/global';
import Image from 'next/image';
import { getStorage } from '@/lib/storage';

// 瀑水流項目組件
function ProjectCard({ project }: { project: Project }) {
  const detailItems = project.details?.items || [];

  return (
    <div className="flex flex-col h-full overflow-hidden group">
      {/* 項目圖片 - 圖片區塊會有放大效果 */}
      <div className="relative w-full pt-[70%] overflow-hidden">
        <Image
          src={project.images && project.images.length > 0 ? project.images[0].imageUrl : '/images/placeholder.jpg'}
          alt={project.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover object-center transition-transform group-hover:scale-105 duration-500"
          priority={project.order <= 4} // 優先加載前四個項目的圖片
        />
      </div>

      {/* 項目文字內容 */}
      <div className="p-4 text-center text-black">
        {/* 項目名称 */}
        <h3 className="text-xl text-[#a48b78] mb-3 border-b border-[#a48b78] pb-2 transition-colors group-hover:font-medium">
          {project.title}
        </h3>

        {/* 項目簡短描述 */}
        {project.description && (
          <p className="text-sm mb-3 line-clamp-2">{project.description}</p>
        )}

        {/* 項目詳情 */}
        {detailItems.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {detailItems.map((item, index) => (
              <div key={index} className="flex text-sm justify-center">
                {item.label ? (
                  <>
                    <span className="">{item.label}</span>
                    <span className="">｜</span>
                  </>
                ) : null}
                <span className="">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 獲取專案數據，60 秒緩存
const getProjects = unstable_cache(
  async (category: string): Promise<Project[]> => {
    try {
      const storage = getStorage();
      const projects = await storage.project.findMany({
        where: { category, isActive: true },
        orderBy: { order: 'asc' }
      });

      // 查詢關聯的 images
      const projectsWithImages = await Promise.all(
        projects.map(async (project) => {
          const images = await storage.projectImage.findMany({
            where: { projectId: project.id },
            orderBy: { order: 'asc' }
          });
          return { ...project, images } as Project;
        })
      );

      return projectsWithImages;
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  },
  ['projects-classic'],
  { revalidate: 60, tags: ['projects'] }
);

export default async function ClassicProjectsPage() {
  const projects = await getProjects('classic');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] lg:min-h-[calc(100vh-220px)]">
      {/* 手機版麵包屑在頁面頂部顯示 */}
      <div className="lg:hidden w-full mb-4">
        <Breadcrumb
          parentTitle="城市美學"
          parentTitleEn="ARCH"
          currentTitle="歷年經典"
          parentPath="/arch"
          parentIsClickable={false}
        />
      </div>

      <div className="flex flex-col lg:flex-row lg:justify-between w-full">
        {/* 左側麵包屑 - 只在桌面版顯示 */}
        <div className="hidden lg:block mb-8 lg:mb-0">
          <Breadcrumb
            parentTitle="城市美學"
            parentTitleEn="ARCH"
            currentTitle="歷年經典"
            parentPath="/arch"
            parentIsClickable={false}
          />
        </div>

        {/* 右側瀑水流內容 */}
        <div className="w-full lg:flex-1 lg:pl-8">
          <div className="w-full pb-12">
            {/* 响應式瀑水流布局
              - 手機顯示一列 (默認)
              - 平板及中等屏幕(sm: >640px)顯示兩列
              - 大屏幕(xl: >1280px)維持兩列
              - 超大屏幕(2xl: >1536px, 接近2K)顯示三列
              - 自定義的4k超大屏幕(>1920px)顯示四列
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 grid-4k-cols-4 gap-6 lg:gap-8">
              {projects.map((project) => (
                <div key={project.id} className="overflow-hidden">
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}