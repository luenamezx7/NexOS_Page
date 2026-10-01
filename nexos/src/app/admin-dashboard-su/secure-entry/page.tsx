import { redirect } from 'next/navigation';
import { getAdminAccess } from '@/lib/auth/session';
import { sanitizeCallbackPath } from '@/lib/auth/callback';
import { enabledSocialProviders } from '@/lib/auth/social';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Acesso restrito | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function SecureEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ confirmation?: string | string[]; callbackUrl?: string | string[] }>;
}) {
  const access = await getAdminAccess();
  const params = await searchParams;
  if (access.ok) redirect(sanitizeCallbackPath(params.callbackUrl) ?? '/dashboard');
  return (
    <LoginForm
      audience="admin"
      confirmationError={params.confirmation === 'error'}
      callbackUrl={sanitizeCallbackPath(params.callbackUrl)}
      socialProviders={enabledSocialProviders()}
    />
  );
}
