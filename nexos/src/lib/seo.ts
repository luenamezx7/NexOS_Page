import type { Metadata } from 'next';
import { config } from '@/config';

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nexoslab.online').origin;

export function siteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function pageMetadata(path: string, title: string, description: string): Metadata {
  const socialTitle = path === '/'
    ? `${config.brand.fullName} | ${title}`
    : `${title} | ${config.brand.name}`;
  return {
    title: { absolute: socialTitle },
    description,
    alternates: { canonical: siteUrl(path) },
    openGraph: {
      type: 'website',
      locale: 'pt_BR',
      siteName: config.brand.fullName,
      url: siteUrl(path),
      title: socialTitle,
      description,
      images: [{ url: siteUrl(config.meta.ogImage), width: 1200, height: 630, alt: 'NexOS — Sites, landing pages e placas NFC' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [siteUrl(config.meta.ogImage)],
    },
  };
}

export const organizationData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': siteUrl('/#organization'),
      name: config.brand.name,
      alternateName: [config.brand.fullName, ...config.brand.alternateNames],
      url: siteUrl(),
      logo: siteUrl('/nexos-logo-light.svg'),
      email: 'nexosperformance@gmail.com',
      telephone: `+${config.whatsapp.number}`,
      taxID: '69.194.842/0001-28',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Rua Joaquim Anicacio Pinto, 0 — Residencial Prefeito Ely Rocha',
        addressLocality: 'Piracanjuba',
        addressRegion: 'GO',
        postalCode: '75643-242',
        addressCountry: 'BR',
      },
      sameAs: ['https://www.instagram.com/_nexoslab/'],
    },
    {
      '@type': 'WebSite',
      '@id': siteUrl('/#website'),
      name: config.brand.fullName,
      alternateName: [config.brand.name, ...config.brand.alternateNames, new URL(SITE_URL).hostname],
      url: siteUrl(),
      inLanguage: 'pt-BR',
      publisher: { '@id': siteUrl('/#organization') },
    },
  ],
};
