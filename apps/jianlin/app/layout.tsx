import type { Metadata, Viewport } from "next";
import "./globals.css";
import Script from "next/script";
import { SentryInit } from "./sentry-init";

const siteUrl = 'https://www.jianlin.com.tw';
const siteName = '建林工業股份有限公司';
const siteDescription = '建林工業經營超過50個年頭，早期從事磚窯廠、營造廠，在營造事業方面投入大量心血鑽研，培養出建林人毫釐必較的理性工業精神。七八年前建林開始醞釀轉型，希望一直以來研究精進的建築材料與建築工法，可以與建築藝術美學相結合，為台灣創造新的人居歷史。';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#00638F' },
    { media: '(prefers-color-scheme: dark)', color: '#00638F' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: ['建林工業', '建築', '營造', '不動產', '台北', '建設公司', '房地產開發', '建案', '預售屋', '新成屋'],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_TW',
    url: siteUrl,
    siteName: siteName,
    title: siteName,
    description: siteDescription,
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: siteName,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
    images: [`${siteUrl}/og-image.jpg`],
  },
  alternates: {
    canonical: siteUrl,
  },
  appleWebApp: {
    statusBarStyle: "black-translucent",
    title: siteName,
    capable: true,
  },
  verification: {
    google: 'your-google-verification-code', // 需要從 Search Console 獲取
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '256x256' },
      { url: '/logo192.png', sizes: '192x192', type: 'image/png' },
      { url: '/logo512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // JSON-LD 結構化數據 - 幫助 Google 和 AI 理解網站內容
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    alternateName: '建林工業',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    description: siteDescription,
    address: {
      '@type': 'PostalAddress',
      addressLocality: '台北市',
      addressRegion: '台北市',
      addressCountry: 'TW',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['zh-TW', 'Chinese'],
    },
    sameAs: [
      // 如果有社交媒體帳號，在這裡添加
    ],
    foundingDate: '1970',
    numberOfEmployees: {
      '@type': 'QuantitativeValue',
      value: '50+',
    },
    slogan: '建林工業 - 超過50年建築營造經驗',
  };

  return (
    <html lang="zh-TW">
      <head>
        {/* Font Awesome */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        {/* JSON-LD 結構化數據 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <SentryInit />
        {children}

        {/* Google Analytics (如果需要) */}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
