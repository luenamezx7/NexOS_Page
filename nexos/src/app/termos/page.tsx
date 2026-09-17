import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de uso dos serviços NexOS: desenvolvimento e Placa Inteligente NFC + QR Code.',
};

export default function TermosPage() {
  return <LegalPage slug="termos" />;
}
