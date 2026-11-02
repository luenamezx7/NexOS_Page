import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Páginas públicas são acessíveis também ao agente Claude-User; áreas
// técnicas, transacionais e privadas continuam fora do alcance de crawlers.
const disallowedPaths = [
  '/api/',
  '/sucesso',
  '/cancelado',
  '/conta',
  '/portal/',
  '/admin-dashboard-su/',
  '/dashboard',
  '/auth/',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Claude-User',
        allow: '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  };
}
