import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// robots.txt padrão de mercado: tudo liberado, exceto áreas
// técnicas e transacionais (API, pós-pagamento, assets internos).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sucesso',
          '/cancelado',
          '/conta',
          '/portal/',
          '/admin-dashboard-su/',
          '/dashboard',
          '/auth/',
        ],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  };
}
