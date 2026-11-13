import 'server-only';
import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import type { Pool } from 'pg';
import { createPool } from '@/lib/auth/db';

/** Only Vercel's platform-owned forwarding header is trusted by this deployment.
 * cf-connecting-ip is forgeable on the direct Vercel origin until origin protection exists.
 * A standalone server must provide an equivalent trusted adapter; default is shared.
 */
export function trustedClientAddress(headers: Headers): string {
  if (process.env.VERCEL !== '1') return 'shared';
  const value = headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ?? '';
  return isIP(value) ? value : 'shared';
}

export async function consumeLimit(scope: string, identity: string, max: number, windowSeconds: number, pool: Pick<Pool, 'query'> = createPool()) {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Rate limit requires server configuration');
  const key = `nexos:${scope}:${createHmac('sha256', secret).update(identity).digest('hex')}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  // One atomic write: concurrent requests across serverless instances share a counter.
  const result = await pool.query<{ count: number; lastRequest: string }>(`
    INSERT INTO public."rateLimit" (key, count, "lastRequest") VALUES ($1, 1, $2)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN "rateLimit"."lastRequest" <= $2 - $3 THEN 1 ELSE LEAST("rateLimit".count + 1, $4 + 1) END,
      "lastRequest" = CASE WHEN "rateLimit"."lastRequest" <= $2 - $3 THEN $2 ELSE "rateLimit"."lastRequest" END
    RETURNING count, "lastRequest"`, [key, now, windowMs, max]);
  const row = result.rows[0];
  return { allowed: row.count <= max, retryAfter: Math.max(1, Math.ceil((Number(row.lastRequest) + windowMs - now) / 1000)) };
}

export function rateLimitResponse(retryAfter: number) {
  return Response.json({ error: 'Muitas tentativas. Tente novamente mais tarde.' }, {
    status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'private, no-store' },
  });
}

/** Daily cron cleanup; never touches Better Auth's own per-path counters. */
export async function pruneRateLimits() {
  await createPool().query('DELETE FROM public."rateLimit" WHERE key LIKE $1 AND "lastRequest" < $2', ['nexos:%', Date.now() - 2 * 86400000]);
}
