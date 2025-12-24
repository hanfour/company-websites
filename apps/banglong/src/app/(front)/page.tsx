import { Suspense } from 'react';
import { unstable_cache } from 'next/cache';
import FullscreenCarousel from '@/components/front/FullscreenCarousel';
import { getStorage } from '@/lib/storage';

// Define the CarouselItem interface
interface CarouselItem {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  linkUrl: string;
  linkText: string;
  order: number;
  isActive: boolean;
  textPosition: string;
  textDirection: string;
}

// 預設資料 - 當資料庫查詢失敗時顯示
const fallbackItems: CarouselItem[] = [
  {
    id: '1',
    imageUrl: '/uploads/carousel/kv-image-01.jpg',
    title: '懂家的生活家',
    description: '',
    linkUrl: '',
    linkText: '',
    order: 1,
    isActive: true,
    textPosition: 'topCenter',
    textDirection: 'vertical'
  },
  {
    id: '2',
    imageUrl: '/uploads/carousel/kv-image-02.jpg',
    title: '懂家的生活家',
    description: '',
    linkUrl: '',
    linkText: '',
    order: 2,
    isActive: true,
    textPosition: 'topLeft',
    textDirection: 'horizontal'
  },
];

// 直接從 storage 獲取輪播數據，60 秒緩存
const getCarouselItems = unstable_cache(
  async (): Promise<CarouselItem[]> => {
    try {
      const storage = getStorage();
      const items = await storage.carousel.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' }
      });

      return items.length > 0 ? (items as CarouselItem[]) : fallbackItems;
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      return fallbackItems;
    }
  },
  ['carousel-items'],
  { revalidate: 60, tags: ['carousel'] }
);

// 輪播數據載入組件
async function CarouselData() {
  const carouselItems = await getCarouselItems();
  
  return (
    <FullscreenCarousel carouselItems={carouselItems} />
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* 在加載中狀態也使用 fallbackItems 而非空數組 */}
      <Suspense fallback={<FullscreenCarousel carouselItems={fallbackItems} />}>
        <CarouselData />
      </Suspense>
    </main>
  );
}