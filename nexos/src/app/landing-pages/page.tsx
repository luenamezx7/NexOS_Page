import { ServicePage } from '@/components/ServicePage';
import { ServicePageStructuredData } from '@/components/ServicePageStructuredData';
import { pageMetadata } from '@/lib/seo';
import { servicePages } from '@/lib/service-pages';

const service = servicePages.landing;
export const metadata = pageMetadata(service.path, service.title, service.description);

export default function LandingPagesPage() {
  return <><ServicePageStructuredData service={service} /><ServicePage service={service} /></>;
}
