import { unstable_cache } from 'next/cache';
import Breadcrumb from '@/components/front/Breadcrumb';
import ProjectCarousel from '@/components/front/ProjectCarousel';
import { getStorage } from '@/lib/storage';
import { Project } from '@/types/global';

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
  ['projects-new'],
  { revalidate: 60, tags: ['projects'] }
);

export default async function NewProjectsPage() {
  const projects = await getProjects('new');

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-160px)] lg:h-[calc(100vh-220px)] min-h-[500px]">
      {/* 手機版麵包屑在頁面頂部顯示 */}
      <div className="lg:hidden w-full mb-4">
        <Breadcrumb
          parentTitle="城市美學"
          parentTitleEn="ARCH"
          currentTitle="新案鑑賞"
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
            currentTitle="新案鑑賞"
            parentPath="/arch"
            parentIsClickable={false}
          />
        </div>

        {/* 右側輪播內容 */}
        <div className="w-full lg:flex-1 lg:pl-8 h-full">
          <div className="h-full overflow-hidden">
            <ProjectCarousel projects={projects} />
          </div>
        </div>
      </div>
    </div>
  );
}
