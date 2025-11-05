import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/auth';
import { getCompanyData } from '@/app/actions';
import AboutBlockEditForm from '@/components/admin/AboutBlockEditForm';
import type { AboutItem } from '@/types';

export default async function EditAboutBlockPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const blockId = resolvedParams.id;

  const company = await getCompanyData();
  const aboutBlocks = (company?.about || []) as any[];

  const foundBlock = aboutBlocks.find((b: any) =>
    b.id === blockId || `block_${b.type}` === blockId
  );

  let block: Partial<AboutItem> = {
    layoutTemplate: 'text-only',
    show: true,
  };

  if (foundBlock) {
    block = {
      ...foundBlock,
      id: foundBlock.id || blockId,
      layoutTemplate: foundBlock.layoutTemplate || 'text-only',
      show: foundBlock.show !== undefined ? foundBlock.show : true,
    };
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <AboutBlockEditForm blockId={blockId} initialBlock={block} allBlocks={aboutBlocks} />
    </div>
  );
}
