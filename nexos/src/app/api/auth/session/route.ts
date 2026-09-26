import { getUserAccess } from '@/lib/auth/user';
import { privateJson } from '@/lib/auth/admin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requireMfa = searchParams.get('requireMfa') !== 'false';
  const access = await getUserAccess(requireMfa);
  if (!access.ok) return privateJson({ ok: false, reason: access.reason ?? 'unauthenticated' }, access.status);
  return privateJson({ ok: true, email: access.email });
}
