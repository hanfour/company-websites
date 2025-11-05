import { MetadataRoute } from 'next';
import { getCases } from '@/lib/data/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.jianlin.com.tw';
  const currentDate = new Date();

  // 獲取所有案例數據
  const cases = await getCases();
  const hotCases = cases.filter(c => c.type === 'hot');
  const historyCases = cases.filter(c => c.type === 'history');

  // 靜態頁面 - 使用新的 SEO 友善 URL
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    // 關於我們 - 新 URL
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // 聯絡我們 - 新 URL
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // 個案列表 - 新 URL
    {
      url: `${baseUrl}/cases`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cases/featured`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cases/completed`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // 物件列表 - 新 URL
    {
      url: `${baseUrl}/properties`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // 動態生成熱銷個案頁面 - 使用新 URL
  const hotPages: MetadataRoute.Sitemap = hotCases.map((caseItem) => ({
    url: `${baseUrl}/cases/featured/${caseItem.numberID}`,
    lastModified: caseItem.updatedAt ? new Date(caseItem.updatedAt) : currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // 動態生成歷年個案頁面 - 使用新 URL
  const historyPages: MetadataRoute.Sitemap = historyCases.map((caseItem) => ({
    url: `${baseUrl}/cases/completed/${caseItem.numberID}`,
    lastModified: caseItem.updatedAt ? new Date(caseItem.updatedAt) : currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...hotPages, ...historyPages];
}
