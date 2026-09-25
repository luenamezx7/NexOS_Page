import { getUserAccess } from '@/lib/auth/user';
import { privateJson } from '@/lib/auth/admin';

export async function GET() {
  const access = await getUserAccess();
  if (!access.ok) return privateJson({ ok: false, reason: access.reason ?? 'unauthenticated' }, access.status);
  return privateJson({ ok: true, email: access.email });
}
