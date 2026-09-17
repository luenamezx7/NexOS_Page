import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Reembolso',
  description: 'Regras de reembolso da NexOS para desenvolvimento e Placa Inteligente, incluindo frete por região.',
};

export default function ReembolsoPage() {
  return <LegalPage slug="reembolso" />;
}
