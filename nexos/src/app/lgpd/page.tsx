import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/lgpd', 'LGPD — Direitos do Titular', 'Direitos do titular, bases legais e encarregado de dados da NexOS (Lei nº 13.709/2018).');

export default function LgpdPage() {
  return <LegalPage slug="lgpd" />;
}
