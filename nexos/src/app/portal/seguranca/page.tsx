import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/session';
import { enabledSocialProviders } from '@/lib/auth/social';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Segurança da conta | NexOS',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * Segurança da conta — ponto de entrada da verificação em duas etapas.
 *
 * Reaproveita o fluxo de enrollment que já existe no LoginForm (QR, confirmação
 * do código e exibição dos códigos de backup) em vez de duplicar a tela. A
 * sessão é exigida: configurar TOTP exige uma sessão já estabelecida.
 */
export default async function SegurancaPage() {
  const access = await getUserAccess();
  if (!access.ok) redirect('/portal/acesso?callbackUrl=/portal/seguranca');

  return (
    <LoginForm
      audience="user"
      initialStep="enroll"
      socialProviders={enabledSocialProviders()}
    />
  );
}
