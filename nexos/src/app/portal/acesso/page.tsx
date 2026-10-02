import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/session';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { enabledSocialProviders, socialAuthMode } from '@/lib/auth/social';
/**
 * Página de acesso — renderiza o LoginForm com audience="user".
 * Redireciona para /conta em caso de autenticação bem-sucedida.
 */
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Área do cliente | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PortalAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string | string[]; callbackUrl?: string | string[]; mfa?: string | string[]; verified?: string | string[] }>;
}) {
  const access = await getUserAccess();
  const params = await searchParams;
  if (access.ok) redirect(sanitizeCallbackPath(params.callbackUrl) ?? '/conta');
  return (
    <LoginForm
      audience="user"
      confirmationError={params.confirmation === 'error'}
      callbackUrl={sanitizeCallbackPath(params.callbackUrl)}
      socialProviders={enabledSocialProviders()}
      socialAuthMode={socialAuthMode()}
      initialStep={params.mfa === 'required' ? 'totp' : 'credentials'}
      verified={params.verified === '1'}
    />
  );
}
