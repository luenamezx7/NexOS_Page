import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/privacidade', 'Política de Privacidade', 'Como a NexOS coleta, usa e protege dados pessoais no site, checkout Pix e contato.');

export default function PrivacidadePage() {
  return <LegalPage slug="privacidade" />;
}
