import { Metadata } from 'next';
import { config } from '@/config';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: config.meta.title,
  description: config.meta.description,
  openGraph: {
    title: config.meta.title,
    description: config.meta.description,
    images: [config.meta.ogImage],
  },
  twitter: {
    card: 'summary_large_image',
    title: config.meta.title,
    description: config.meta.description,
    images: [config.meta.ogImage],
  },
};

export default function Home() {
  return <HomeClient />;
}