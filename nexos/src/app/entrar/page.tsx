import { redirect } from 'next/navigation';
import { getUserAccess } from '@/lib/auth/user';
import { LoginForm } from '@/app/login/LoginForm';

export const metadata = { title: 'Minha conta | NexOS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function UserLoginPage({ searchParams }: { searchParams: Promise<{ confirmation?: string }> }) {
  const access = await getUserAccess();
  if (access.ok) redirect('/conta');
  const params = await searchParams;
  return <LoginForm audience="user" initialMfa={access.reason === 'mfa'} confirmationError={params.confirmation === 'error'} />;
}
