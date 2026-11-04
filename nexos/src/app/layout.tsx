import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { CookieConsentProvider } from '@/components/cookie-consent';
import { SiteAtmosphere } from '@/components/SiteAtmosphere';
import { JsonLd } from '@/components/JsonLd';
import { config } from '@/config';
import { organizationData, pageMetadata, SITE_URL } from '@/lib/seo';
import { geist, syne } from '@/lib/site-fonts';
import { LocaleProvider } from '@/lib/locale';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: config.brand.fullName,
  icons: {
    icon: [
      { url: '/favicon.png?v=2', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.png?v=2',
    apple: { url: '/favicon.png?v=2', type: 'image/png', sizes: '192x192' },
  },
  title: {
    default: `${config.brand.fullName} | ${config.meta.title}`,
    template: `%s | ${config.brand.name}`,
  },
  description: config.meta.description,
  authors: [{ name: config.brand.fullName }],
  creator: config.brand.fullName,
  publisher: config.brand.fullName,
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
  openGraph: pageMetadata('/', config.meta.title, config.meta.description).openGraph,
  twitter: pageMetadata('/', config.meta.title, config.meta.description).twitter,
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${geist.variable} ${syne.variable} font-sans dark`}>
      <head>
        <link rel="preload" href="/fonts/martian-mono-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-screen min-h-dvh w-full max-w-full overflow-x-clip antialiased">
        <JsonLd data={organizationData} />
        <noscript>
          <style>{`[data-reveal], .landing-page [style*="opacity"], .service-page [style*="opacity"] { opacity: 1 !important; transform: none !important; filter: none !important; } .landing-hero a[href^="#"] { pointer-events: auto !important; } .presentation-replay { display: none !important; }`}</style>
        </noscript>
          <LocaleProvider><SmoothScrollProvider>
            <SiteAtmosphere />
            <div className="site-shell"><CookieConsentProvider>{children}</CookieConsentProvider></div>
          </SmoothScrollProvider></LocaleProvider>
      </body>
    </html>
  );
}
