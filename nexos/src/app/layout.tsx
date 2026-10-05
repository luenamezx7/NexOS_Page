import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Geist, Space_Grotesk, Space_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsentProvider } from '@/components/cookie-consent';
import { SiteAtmosphere } from '@/components/SiteAtmosphere';
import { JsonLd } from '@/components/JsonLd';
import { config } from '@/config';
import { organizationData, pageMetadata, SITE_URL } from '@/lib/seo';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const terminal = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-terminal', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: config.brand.fullName,
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
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
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f3ead9' }, { media: '(prefers-color-scheme: dark)', color: '#000000' }],
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
  const themeScriptContent = `(function(){var t;try{t=localStorage.getItem('nexos-theme');}catch(e){}var s=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',s==='dark');document.documentElement.style.colorScheme='only '+s;var m=document.querySelector('meta[name=color-scheme]');if(m)m.content=s;try{if(sessionStorage.getItem('nexos-boot-seen')==='1'||location.hash)document.documentElement.dataset.nexosBootSeen='1';}catch(e){}})()`;

  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans dark", geist.variable, spaceGrotesk.variable, terminal.variable)}>
      <head>
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
          <style>{`.landing-page [style*="opacity"], .service-page [style*="opacity"] { opacity: 1 !important; transform: none !important; } .presentation-replay { display: none !important; }`}</style>
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
