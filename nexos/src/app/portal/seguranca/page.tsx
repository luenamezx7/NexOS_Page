import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserAccess } from '@/lib/auth/session';
import { getAuth } from '@/lib/auth/instance';
import { SecuritySettings } from '@/components/auth/SecuritySettings';
import { sanitizeCallbackPath } from '@/lib/auth/callback';

export const metadata = { title: 'Segurança da conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SegurancaPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const access = await getUserAccess();
  if (!access.ok) {
    if (access.status === 503) return <main className="mx-auto max-w-lg px-6 py-20"><h1 className="text-2xl">Serviço temporariamente indisponível</h1><p role="alert">Não foi possível verificar sua sessão.</p></main>;
    redirect('/portal/acesso?callbackUrl=/portal/seguranca');
  }
  const accounts = await getAuth().api.listUserAccounts({ headers: await headers() });
  const params = await searchParams;
  return (
    <main className="page-surface min-h-screen text-ink">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-3"><Link href="/conta" className="self-start text-sm underline underline-offset-4">Voltar à minha conta</Link><h1 className="page-title brand-heading font-display font-bold">Segurança da conta</h1><p className="text-muted-foreground">Gerencie sua senha, suas chaves de acesso e o aplicativo autenticador.</p></header>
        <SecuritySettings enabled={access.twoFactorEnabled} hasPassword={accounts.some(a => a.providerId === 'credential')} isAdmin={access.role === 'admin'} callbackUrl={sanitizeCallbackPath(params.callbackUrl)} />
      </div>
    </main>
  );
}
