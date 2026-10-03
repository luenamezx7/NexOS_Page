import { Metadata } from 'next';
import { config } from '@/config';
import HomeClient from './home-client';
import { redirect } from 'next/navigation';
import { checkoutHref, checkoutQuantity } from '@/lib/checkout';

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

export default async function Home({ searchParams }: { searchParams: Promise<{ checkout?: string | string[]; quantity?: string | string[] }> }) {
  const params = await searchParams;
  const legacyProduct = Array.isArray(params.checkout) ? params.checkout[0] : params.checkout;
  if (legacyProduct && config.services.some(product => product.id === legacyProduct)) redirect(checkoutHref(legacyProduct, checkoutQuantity(Array.isArray(params.quantity) ? params.quantity[0] : params.quantity)));
  return <HomeClient />;
}
