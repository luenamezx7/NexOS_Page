import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Páginas públicas são acessíveis também ao agente Claude-User; áreas
// técnicas, transacionais e privadas continuam fora do alcance de crawlers.
const disallowedPaths = [
  '/api/',
  '/conta',
  '/portal/',
  '/admin-dashboard-su/',
  '/dashboard',
  // F-08: rotas reais que faltavam.
  '/og',        // gera um PNG renderizado (200) — não deve ser rastreado
  '/verificar', // página do desafio Turnstile
  // F-08: '/auth/' foi removido — a rota não existe (404).
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
