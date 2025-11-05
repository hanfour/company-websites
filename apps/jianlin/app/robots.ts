import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.jianlin.com.tw';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
      // 特別允許 Google AI 爬蟲
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      // 特別允許 GPT 爬蟲
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      // 特別允許 Claude 爬蟲
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
