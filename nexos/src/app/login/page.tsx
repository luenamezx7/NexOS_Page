import { redirect } from 'next/navigation';
import { getAdminAccess } from '@/lib/auth/admin';
import { LoginForm } from './LoginForm';

export const metadata = { title: 'Acesso administrativo | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const access = await getAdminAccess();
  if (access.ok) redirect('/dashboard');
  return <LoginForm initialMfa={access.reason === 'mfa'} />;
}
