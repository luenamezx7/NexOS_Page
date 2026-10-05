import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';
import { servicePages } from '@/lib/service-pages';

// Sitemap referenciado pelo robots.txt (páginas indexáveis).
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: Array<{ path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }> = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    ...Object.values(servicePages).map(page => ({ path: page.path, priority: 0.8, changeFrequency: 'monthly' as const })),
    { path: '/privacidade', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/termos', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/lgpd', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/reembolso', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/cookies', priority: 0.4, changeFrequency: 'yearly' },
  ];
  return pages.map((p) => ({
    url: siteUrl(p.path),
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
