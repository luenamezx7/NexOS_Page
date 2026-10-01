import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getAdminAccess } from '@/lib/auth/session';
import { adminDiagnostics } from '@/lib/admin-health';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const access = await getAdminAccess();
  if (!access.ok) {
    if (access.reason === 'mfa_setup') redirect('/portal/seguranca?callbackUrl=/dashboard');
    redirect('/admin-dashboard-su/secure-entry');
  }
  const diagnostics = await adminDiagnostics();
  return <DashboardClient user={{ email: access.email, is_anonymous: false }} isAllowed diagnostics={diagnostics} />;
}
