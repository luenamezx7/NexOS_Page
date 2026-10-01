import { getAdminAccess } from '@/lib/auth/session';
import { deniedJson, privateJson } from '@/lib/auth/http';
import { cloudflareHealth } from '@/lib/admin-health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const access = await getAdminAccess();
  if (!access.ok) return deniedJson(access.status);
  return privateJson(await cloudflareHealth());
}
