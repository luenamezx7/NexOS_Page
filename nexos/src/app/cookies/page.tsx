import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Como a NexOS usa cookies essenciais e opcionais (LGPD) e como gerenciar suas preferências.',
};

export default function CookiesPage() {
  return <LegalPage slug="cookies" />;
}
