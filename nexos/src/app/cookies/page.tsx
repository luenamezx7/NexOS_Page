import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/cookies', 'Política de Cookies', 'Como a NexOS usa cookies essenciais e opcionais (LGPD) e como gerenciar suas preferências.');

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
