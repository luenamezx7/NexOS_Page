import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/user';
import { LogoutButton } from '@/components/LogoutButton';

export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const access = await getUserAccess();
  if (!access.ok) redirect('/portal/acesso');
  return <main className="min-h-[100dvh] bg-canvas px-6 py-12 text-ink">
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Link href="/" className="font-display text-2xl font-bold">NexOS.</Link>
      <header className="flex flex-col gap-3 border-b border-ink/15 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest">Área do cliente</p>
        <h1 className="font-display text-4xl font-bold">Sua conta, protegida.</h1>
        <p className="break-all text-ink/75">{access.email}</p>
      </header>
      <section aria-labelledby="security-title" className="flex flex-col gap-3">
        <h2 id="security-title" className="text-xl font-semibold">Segurança da sessão</h2>
        <p>E-mail confirmado e autenticação em duas etapas verificada.</p>
        <p className="text-sm text-ink/75">Guarde o acesso ao seu aplicativo autenticador. Se perder o dispositivo, contate a equipe para recuperar sua conta.</p>
      </section>
      <div className="flex flex-wrap items-center gap-4"><LogoutButton /><Link href="/" className="text-sm underline underline-offset-4">Voltar ao site</Link></div>
    </div>
  </main>;
}
