import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata('/termos', 'Termos de Uso', 'Termos de uso dos serviços NexOS: desenvolvimento e Placa Inteligente NFC + QR Code.');

export default function TermosPage() {
  return <LegalPage slug="termos" />;
}
