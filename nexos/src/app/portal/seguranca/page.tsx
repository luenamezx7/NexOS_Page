import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUserAccess } from '@/lib/auth/session';
import { getAuth } from '@/lib/auth/instance';
import { SecuritySettings } from '@/components/auth/SecuritySettings';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { AuthHeader } from '@/components/auth/AuthFrame';
import styles from '@/components/auth/SecuritySettings.module.css';
import { PageStatus } from '@/components/PageStatus';
import { PageFooter } from '@/components/PageChrome';

export const metadata = { title: 'Segurança da conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SegurancaPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const access = await getUserAccess();
  if (!access.ok) {
    if (access.status === 503) return <PageStatus label="Segurança da conta" title="Serviço temporariamente indisponível" description="Não foi possível verificar sua sessão." alert />;
    redirect('/portal/acesso?callbackUrl=/portal/seguranca');
  }
  const accounts = await getAuth().api.listUserAccounts({ headers: await headers() });
  const params = await searchParams;
  return (
    <main className="interior-page">
      <AuthHeader />
      <div className={styles.page} id="main-content">
        <header className={styles.header}><Link href="/conta" className="page-text-link">Voltar à minha conta</Link><p className="page-kicker">NexOS / Sua proteção</p><h1 className="page-title">Segurança da conta</h1><p className="text-muted-foreground">Gerencie sua senha, suas chaves de acesso e o aplicativo autenticador.</p></header>
        <SecuritySettings enabled={access.twoFactorEnabled} hasPassword={accounts.some(a => a.providerId === 'credential')} isAdmin={access.role === 'admin'} callbackUrl={sanitizeCallbackPath(params.callbackUrl)} />
      </div>
      <PageFooter />
    </main>
  );
}
