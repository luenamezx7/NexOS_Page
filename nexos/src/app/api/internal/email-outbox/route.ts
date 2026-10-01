import { timingSafeEqual } from 'node:crypto';
import { retryNotifications } from '@/lib/emails/notifications';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const actual = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${secret ?? ''}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  await retryNotifications();
  return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
