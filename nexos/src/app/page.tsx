import { Metadata } from 'next';
import { config } from '@/config';
import HomeClient from './home-client';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/', config.meta.title, config.meta.description);

export default function Home() {
  return <HomeClient />;
}
