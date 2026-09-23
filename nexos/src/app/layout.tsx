import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import GlobalNoise from '@/components/GlobalNoise';
import { PageBlur } from '@/components/PageBlur';
import { SmoothScrollProvider } from '@/components/SmoothScrollProvider';
import { ThemeProvider } from '@/components/ThemeProvider';
import { CookieConsentProvider } from '@/components/cookie-consent';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const dirtyline = localFont({
  src: '../../public/fonts/dirtyline.woff2',
  variable: '--font-dirty',
  display: 'swap',
  weight: '400',
});

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
  themeColor: '#050505',
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
  const themeScriptContent = `(function(){try{var t=localStorage.getItem('nexos-theme');var s=t==='light'?'light':'dark';if(t==='light'){document.documentElement.classList.remove('dark');}else{document.documentElement.classList.add('dark');}document.documentElement.style.colorScheme='only '+s;var m=document.querySelector('meta[name=color-scheme]');if(m)m.content=s;}catch(e){}})()`;

  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans dark", geist.variable, geistMono.variable, spaceGrotesk.variable, dirtyline.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
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
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
        <GlobalNoise
          noiseIntensity={0.03}
          scanlineIntensity={0.02}
          scanlineFrequency={1.0}
          speed={1.0}
        />
        <PageBlur />
      </body>
    </html>
  );
}
