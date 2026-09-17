import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a NexOS coleta, usa e protege dados pessoais no site, checkout Stripe e contato.',
};

export default function PrivacidadePage() {
  return <LegalPage slug="privacidade" />;
}
