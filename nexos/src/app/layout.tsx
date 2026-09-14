import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import GlobalNoise from '@/components/GlobalNoise';
import GradualBlur from '@/components/GradualBlur';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400&display=swap"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
        <GlobalNoise
          noiseIntensity={0.03}
          scanlineIntensity={0.02}
          scanlineFrequency={1.0}
          speed={1.0}
        />
        <GradualBlur
          target="page"
          position="bottom"
          height="6rem"
          strength={5}
          divCount={1}
          curve="bezier"
          exponential={true}
          opacity={1}
          animated="scroll"
          hideAtSelector="footer"
        />
      </body>
    </html>
  );
}
