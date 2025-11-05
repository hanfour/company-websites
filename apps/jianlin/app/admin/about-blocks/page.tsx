import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getCompanyData } from '@/app/actions';
import AboutBlocksList from '@/components/admin/AboutBlocksList';
import type { AboutItem } from '@/types';

export default async function AboutBlocksPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const company = await getCompanyData();
  let aboutBlocks = (company?.about || []) as any[];

  // 轉換舊格式到新格式
  aboutBlocks = aboutBlocks.map((block: any, index: number) => ({
    id: block.id || `block_${block.type || index}`,
    order: block.order !== undefined ? block.order : index,
    show: block.show !== undefined ? block.show : true,
    title: block.title || '',
    caption: block.caption || '',
    src: block.src || '',
    location: block.location || '',
    layoutTemplate: block.layoutTemplate || 'text-only',
    type: block.type,
  }));

  // 按 order 排序
  aboutBlocks.sort((a: AboutItem, b: AboutItem) => a.order - b.order);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <AboutBlocksList initialBlocks={aboutBlocks as AboutItem[]} />
    </div>
  );
}
