import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { MetallicSurface } from '@/components/ui/metallic-button';

/**
 * Página de redefinição de senha.
 *
 * A autenticação é o próprio link: o Better Auth entrega um token JWT na query
 * (`?token=`) e a troca acontece sem sessão pré-existente. Nada aqui depende
 * de sessão do Supabase nem de privilégio administrativo — por isso MFA não
 * bloqueia a recuperação.
 */
export const metadata: Metadata = {
  title: 'Redefinir senha | NexOS',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const raw = params.token;
  const token = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? '';

  if (token) return <ResetPasswordForm token={token} />;

  return (
    <main className="page-surface min-h-[100dvh] px-6 py-16 text-ink">
      <div className="mx-auto flex max-w-md flex-col gap-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#be185d]">Recuperação</p>
        <h1 className="page-title brand-heading font-display font-bold tracking-tight">Link necessário</h1>
        <p className="text-sm leading-relaxed text-ink/70">
          Para redefinir a senha é preciso o link enviado por e-mail. Ele é de uso único e expira em
          pouco tempo. Peça um novo em “Esqueceu a senha”.
        </p>
        <Link href="/portal/acesso" className="btn-primary-nex justify-center">
          <MetallicSurface /><span className="metallic-content">Pedir um novo link</span>
        </Link>
        <p className="text-xs text-ink/55">
          Suporte ·{' '}
          <a href="mailto:nexosperformance@gmail.com" className="underline underline-offset-4">
            nexosperformance@gmail.com
          </a>
        </p>
      </div>
    </main>
  );
}
