import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getCompanyData } from '@/app/actions';
import HomeBlocksList from '@/components/admin/HomeBlocksList';
import type { HomeContentItem } from '@/types';

export default async function HomeBlocksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const company = await getCompanyData();
  let homeBlocks = (company?.home || []) as any[];

  // 轉換舊格式到新格式
  homeBlocks = homeBlocks.map((block: any, index: number) => ({
    id: block.id || `block_${block.type || index}`,
    blockType: block.blockType || 'content',
    order: block.order !== undefined ? block.order : index,
    show: block.show !== undefined ? block.show : true,
    name: block.name || '',
    caption: block.caption || '',
    src: block.src || '',
    location: block.location || '',
    link: block.link || '',
    imagePosition: block.imagePosition || (index % 2 === 0 ? 'right' : 'left'),
    titleText: block.titleText || '',
    titleStyle: block.titleStyle || '',
    type: block.type,
  }));

  // 按 order 排序
  homeBlocks.sort((a: HomeContentItem, b: HomeContentItem) => a.order - b.order);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <HomeBlocksList initialBlocks={homeBlocks as HomeContentItem[]} />
    </div>
  );
}
