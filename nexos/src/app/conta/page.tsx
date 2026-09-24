import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, ShieldCheck, KeyRound, Mail } from 'lucide-react';
import { getUserAccess } from '@/lib/auth/user';
import { LogoutButton } from '@/components/LogoutButton';

export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const access = await getUserAccess();
  if (!access.ok) redirect('/portal/acesso');
  return (
    <main className="min-h-[100dvh] bg-canvas px-5 py-14 text-ink sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
          Voltar ao site
        </Link>

        <header className="flex flex-col gap-3 border-b border-ink/12 pb-8">
          <p className="font-mono text-xs uppercase tracking-widest text-[#be185d]">Área do cliente</p>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Sua conta, protegida.
          </h1>
          <p className="break-all font-mono text-sm text-ink/70">{access.email}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="bento-card p-5" aria-labelledby="sec-email">
            <div className="flex items-center justify-between gap-3">
              <h2 id="sec-email" className="inline-flex items-center gap-2 text-sm font-semibold">
                <Mail size={15} strokeWidth={1.75} aria-hidden="true" />
                E-mail confirmado
              </h2>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Seu endereço foi verificado. Avisos de acesso e segurança usam este e-mail.
            </p>
          </section>

          <section className="bento-card p-5" aria-labelledby="sec-mfa">
            <div className="flex items-center justify-between gap-3">
              <h2 id="sec-mfa" className="inline-flex items-center gap-2 text-sm font-semibold">
                <KeyRound size={15} strokeWidth={1.75} aria-hidden="true" />
                Duas etapas (TOTP)
              </h2>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.55)]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink/65">
              Autenticação em duas etapas verificada nesta sessão.
            </p>
          </section>
        </div>

        <section className="bento-card p-5" aria-labelledby="security-title">
          <h2 id="security-title" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck size={15} strokeWidth={1.75} aria-hidden="true" />
            Segurança da sessão
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">
            E-mail confirmado e autenticação em duas etapas verificada. Guarde o acesso ao seu
            aplicativo autenticador. Se perder o dispositivo, contate a equipe para recuperar sua
            conta.
          </p>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40">
            Suporte · nexosperformance@gmail.com
          </p>
        </section>

        <div className="flex flex-wrap items-center gap-4 border-t border-ink/12 pt-6">
          <LogoutButton />
          <Link href="/" className="text-sm underline underline-offset-4">
            Voltar ao site
          </Link>
        </div>
      </div>
    </main>
  );
}
