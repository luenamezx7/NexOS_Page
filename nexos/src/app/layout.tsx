import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsentProvider } from '@/components/cookie-consent';
import { SiteAtmosphere } from '@/components/SiteAtmosphere';
import { JsonLd } from '@/components/JsonLd';
import { config } from '@/config';
import { organizationData, pageMetadata, SITE_URL } from '@/lib/seo';
import { geist, syne } from '@/lib/site-fonts';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: config.brand.fullName,
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/mascote-tigre-albino.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    shortcut: '/favicon.png',
    apple: { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
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
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#faf7fc' }, { media: '(prefers-color-scheme: dark)', color: '#000000' }],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce');
  const themeScriptContent = `(function(){var t;try{t=localStorage.getItem('nexos-theme');}catch(e){}var s=t==='light'||t==='dark'?t:'dark';document.documentElement.classList.toggle('dark',s==='dark');document.documentElement.style.colorScheme='only '+s;var m=document.querySelector('meta[name=color-scheme]');if(m)m.content=s;})()`;

  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${geist.variable} ${syne.variable} font-sans dark`}>
      <head>
        <link rel="preload" href="/fonts/martian-mono-variable.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <meta name="color-scheme" content="dark" />
        {nonce ? (
          <script nonce={nonce} dangerouslySetInnerHTML={{ __html: themeScriptContent }} />
        ) : (
          <script dangerouslySetInnerHTML={{ __html: themeScriptContent }} />
        )}
      </head>
      <body className="min-h-screen min-h-dvh w-full max-w-full overflow-x-clip antialiased">
        <JsonLd data={organizationData} />
        <noscript>
          <style>{`[data-reveal], .landing-page [style*="opacity"], .service-page [style*="opacity"] { opacity: 1 !important; transform: none !important; filter: none !important; } .landing-hero a[href^="#"] { pointer-events: auto !important; } .presentation-replay { display: none !important; }`}</style>
        </noscript>
        <ThemeProvider>
          <SmoothScrollProvider>
            <SiteAtmosphere />
            <div className="site-shell"><CookieConsentProvider>{children}</CookieConsentProvider></div>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
