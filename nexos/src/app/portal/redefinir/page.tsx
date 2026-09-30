import type { Metadata } from 'next';
import { getAdminAccess } from '@/lib/auth/admin';
import { getUserAccess } from '@/lib/auth/user';
import { isRecoveryTokenHash } from '@/lib/auth/recovery';
/**
 * Página de redefinição de senha — renderiza o ResetPasswordForm.
 * O usuário deve ter uma sessão de recovery válida (via /auth/callback).
 */
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Redefinir senha | NexOS',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

// Sessão de recovery (após /auth/callback) ou sessão logada.
// Não exige MFA aqui — o usuário ainda não redefiniu a senha.
export default async function ResetPasswordPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[]; recovery?: string | string[] }>;
}) {
  const params = await searchParams;
  if (isRecoveryTokenHash(params.token_hash)) {
    // Render the password form immediately; the POST validates the link before updating.
    return <ResetPasswordForm audience="user" email="" tokenHash={params.token_hash} />;
  }
  // Admin primeiro: allowlist identifica o operador; senão, conta comum.
  const invalidLink = params.recovery === 'error' || params.token_hash !== undefined;
  const admin = invalidLink ? { ok: false as const } : await getAdminAccess(false);
  if (admin.ok) {
    return <ResetPasswordForm audience="admin" email={admin.email} />;
  }
  const user = invalidLink ? { ok: false as const } : await getUserAccess(false);
  if (user.ok) {
    return <ResetPasswordForm audience="user" email={user.email} />;
  }
  // Sem sessão: link expirado ou acesso direto.
  return (
    <main className="min-h-[100dvh] bg-canvas px-6 py-16 text-ink">
      <div className="mx-auto flex max-w-md flex-col gap-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-[#be185d]">Recuperação</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Link inválido ou expirado</h1>
        <p className="text-sm leading-relaxed text-ink/70">
          Peça um novo link de redefinição na tela de login. Se o problema continuar, fale com a
          equipe.
        </p>
        <a href="/portal/acesso" className="btn-primary-nex justify-center">
          Voltar ao login
        </a>
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
