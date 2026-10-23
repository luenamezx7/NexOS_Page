import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/session';
import AccountClient from '@/components/account/AccountClient';
import { PageStatus } from '@/components/PageStatus';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };

export default async function ContaPage() {
  const access = await getUserAccess();
  if (!access.ok) {
    if (access.status === 503) return <PageStatus label="Minha conta" title="Serviço temporariamente indisponível" description="Não foi possível verificar sua sessão. Tente novamente em alguns instantes." alert />;
    redirect('/portal/acesso?callbackUrl=/conta');
  }
  return <AccountClient />;
}
