import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/reembolso', 'Política de Reembolso', 'Regras de reembolso da NexOS para desenvolvimento e Placa Inteligente, incluindo frete por região.');

export default function ReembolsoPage() {
  return <LegalPage slug="reembolso" />;
}
