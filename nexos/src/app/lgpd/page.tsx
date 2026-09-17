import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'LGPD — Direitos do Titular',
  description: 'Direitos do titular, bases legais e encarregado de dados da NexOS (Lei nº 13.709/2018).',
};

export default function LgpdPage() {
  return <LegalPage slug="lgpd" />;
}
