import { unstable_cache } from 'next/cache';
import Breadcrumb from '@/components/front/Breadcrumb';
import ContentBlock from '@/components/front/ContentBlock';
import { Project } from '@/types/global';
import { getStorage } from '@/lib/storage';

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
  ['projects-future'],
  { revalidate: 60, tags: ['projects'] }
);

export default async function FutureProjectsPage() {
  const projects = await getProjects('future');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-160px)] lg:min-h-[calc(100vh-220px)]">
      {/* 手機版麵包屑在頁面頂部顯示 */}
      <div className="lg:hidden w-full mb-4">
        <Breadcrumb
          parentTitle="城市美學"
          parentTitleEn="ARCH"
          currentTitle="未來計畫"
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
            currentTitle="未來計畫"
            parentPath="/arch"
            parentIsClickable={false}
          />
        </div>

        {/* 右側内容 */}
        <div className="w-full lg:flex-1 lg:pl-8 pb-12">
          <div className="w-full">
            {/* 垂直排列的未來計畫項目列表 */}
            <div className="space-y-12">
              {projects.map((project) => (
                <ContentBlock
                  key={project.id}
                  layout="image-left-text"
                  imageSrc={project.images && project.images.length > 0 ? project.images[0].imageUrl : '/images/placeholder.jpg'}
                  imageAlt={project.title}
                  title1={project.title}
                  text1={project.description}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}