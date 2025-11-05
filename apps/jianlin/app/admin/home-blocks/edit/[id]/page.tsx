import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getCompanyData } from '@/app/actions';
import HomeBlockEditForm from '@/components/admin/HomeBlockEditForm';
import type { HomeContentItem } from '@/types';

export default async function EditHomeBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const blockId = resolvedParams.id;

  const company = await getCompanyData();
  const homeBlocks = (company?.home || []) as any[];

  const foundBlock = homeBlocks.find((b: any) =>
    b.id === blockId || `block_${b.type}` === blockId
  );

  let block: Partial<HomeContentItem> = {
    blockType: 'content',
    show: true,
    imagePosition: 'right',
  };

  if (foundBlock) {
    block = {
      ...foundBlock,
      id: foundBlock.id || blockId,
      blockType: foundBlock.blockType || 'content',
      show: foundBlock.show !== undefined ? foundBlock.show : true,
      imagePosition: foundBlock.imagePosition || 'right',
    };
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <HomeBlockEditForm blockId={blockId} initialBlock={block} allBlocks={homeBlocks} />
    </div>
  );
}
