import type { MetadataRoute } from 'next';

// robots.txt padrão de mercado: tudo liberado, exceto áreas
// técnicas e transacionais (API, pós-pagamento, assets internos).
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nexos.digital').replace(/\/$/, '');
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sucesso',
          '/cancelado',
          '/_next/',
          '/conta',
          '/portal/',
          '/admin-dashboard-su/',
          '/dashboard',
          '/auth/',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
