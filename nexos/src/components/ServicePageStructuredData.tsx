import { config } from '@/config';
import { siteUrl } from '@/lib/seo';
import type { ServicePageContent } from '@/lib/service-pages';
import { JsonLd } from './JsonLd';

export function ServicePageStructuredData({ service }: { service: ServicePageContent }) {
  const isPlate = service.productId === 'placa';
  const product = config.services.find(item => item.id === service.productId)!;
  return <JsonLd data={{
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ezway', item: siteUrl() },
          { '@type': 'ListItem', position: 2, name: service.label, item: siteUrl(service.path) },
        ],
      },
      isPlate ? {
        '@type': 'Product',
        '@id': siteUrl(`${service.path}#product`),
        name: product.title,
        description: service.description,
        image: [siteUrl('/placas/codex-1.png')],
        brand: { '@type': 'Brand', name: config.brand.name },
        url: siteUrl(service.path),
      } : {
        '@type': 'Service',
        '@id': siteUrl(`${service.path}#service`),
        name: service.label,
        serviceType: service.label,
        description: service.description,
        url: siteUrl(service.path),
        provider: { '@id': siteUrl('/#organization') },
      },
    ],
  }} />;
}
