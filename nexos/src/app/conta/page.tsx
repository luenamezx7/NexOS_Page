import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/session';
import AccountClient from '@/components/account/AccountClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };

export default async function ContaPage() {
  const access = await getUserAccess();
  if (!access.ok) {
    if (access.status === 503) return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-2xl">Serviço temporariamente indisponível</h1><p role="alert">Não foi possível verificar sua sessão. Tente novamente em alguns instantes.</p></main>;
    redirect('/portal/acesso?callbackUrl=/conta');
  }
  return <AccountClient />;
}
