import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/user';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Área do cliente | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function PortalAcessoPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string | string[]; callbackUrl?: string | string[] }>;
}) {
  const access = await getUserAccess();
  const params = await searchParams;
  if (access.ok) redirect(sanitizeCallbackPath(params.callbackUrl) ?? '/conta');
  return (
    <LoginForm
      audience="user"
      initialMfa={access.reason === 'mfa'}
      confirmationError={params.confirmation === 'error'}
      callbackUrl={sanitizeCallbackPath(params.callbackUrl)}
    />
  );
}
