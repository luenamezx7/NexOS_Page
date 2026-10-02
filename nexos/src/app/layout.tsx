import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Geist, Space_Grotesk, Space_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsentProvider } from '@/components/cookie-consent';
import { SiteAtmosphere } from '@/components/SiteAtmosphere';

const geist = Geist({ subsets: ['latin'], variable: '--font-geist', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space', display: 'swap' });
const terminal = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-terminal', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nexoslab.online'),
  title: {
    default: 'NexOS — Serviços Digitais de Escala',
    template: '%s | NexOS',
  },
  description: 'Desenvolvimento, design e estratégia para produtos digitais que escalam. Da ideia ao mercado com velocidade e qualidade.',
  keywords: ['desenvolvimento web', 'product design', 'estratégia digital', 'MVP', 'startup', 'React', 'Next.js'],
  authors: [{ name: 'NexOS' }],
  creator: 'NexOS',
  publisher: 'NexOS',
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
    locale: 'pt_BR',
    url: 'https://nexos.digital',
    siteName: 'NexOS',
    title: 'NexOS — Serviços Digitais de Escala',
    description: 'Desenvolvimento, design e estratégia para produtos digitais que escalam.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'NexOS - Serviços Digitais de Escala',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NexOS — Serviços Digitais de Escala',
    description: 'Desenvolvimento, design e estratégia para produtos digitais que escalam.',
    images: ['/og-image.png'],
    creator: '@nexos',
  },
  verification: {
    google: 'google-site-verification-code',
  },
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
  const themeScriptContent = `(function(){var t;try{t=localStorage.getItem('nexos-theme');}catch(e){}var s=t==='light'||t==='dark'?t:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',s==='dark');document.documentElement.style.colorScheme='only '+s;var m=document.querySelector('meta[name=color-scheme]');if(m)m.content=s;})()`;

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
