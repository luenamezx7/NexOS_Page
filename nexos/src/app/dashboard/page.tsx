import { DashboardClient } from '@/components/dashboard/DashboardClient';
import { getAdminAccess } from '@/lib/auth/admin';
import { adminDiagnostics } from '@/lib/admin-health';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const access = await getAdminAccess();
  if (!access.ok) {
    redirect('/login');
  }
  const diagnostics = await adminDiagnostics();
  return <DashboardClient user={{ email: 'Administrador', is_anonymous: false }} isAllowed diagnostics={diagnostics} />;
}
