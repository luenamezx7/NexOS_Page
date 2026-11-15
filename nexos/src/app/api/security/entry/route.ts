import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';
import { consumeLimit, rateLimitResponse, trustedClientAddress } from '@/lib/rate-limit';
import { isTurnstileConfigured, verifyTurnstileToken } from '@/lib/turnstile';
import { createEntryToken, ENTRY_ACTION, ENTRY_TTL, entryCookies, entryReturnPath, readEntryToken, siteEntryEnforced } from '@/lib/site-entry';

export const dynamic = 'force-dynamic';
const input = z.object({ token: z.string().min(1).max(2048), next: z.string().max(2048).optional() }).strict();
const json = (body: object, status: number) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return json({ error: 'Origem inválida.' }, 403);
  if (!siteEntryEnforced() || !isTurnstileConfigured()) return json({ error: 'Verificação de segurança indisponível.' }, 503);
  try {
    const parsed = input.safeParse(await readJsonBody(req, 8192));
    if (!parsed.success) return json({ error: 'Conclua a verificação para continuar.' }, 400);
    const names = entryCookies(req.url);
    const userAgent = req.headers.get('user-agent') || '';
    const address = trustedClientAddress(req.headers);
    const challenge = readEntryToken(req.cookies.get(names.challenge)?.value, 'challenge', userAgent, Date.now(), address);
    if (!challenge) return json({ error: 'A verificação expirou. Recarregue esta página.' }, 403);
    const limit = await consumeLimit('site-entry-source', address, 30, 300);
    if (!limit.allowed) return rateLimitResponse(limit.retryAfter);
    const result = await verifyTurnstileToken(parsed.data.token, address === 'shared' ? undefined : address);
    if (!result.success || result.action !== ENTRY_ACTION || result.cdata !== challenge.nonce) {
      return json({ error: 'Não foi possível confirmar a verificação. Tente novamente.' }, 403);
    }
    const clearance = createEntryToken('clearance', userAgent, Date.now(), address);
    const response = json({ redirectTo: entryReturnPath(parsed.data.next) }, 200);
    const options = { httpOnly: true, secure: names.secure, sameSite: 'lax' as const, path: '/' };
    response.cookies.set(names.clearance, clearance.token, { ...options, maxAge: ENTRY_TTL });
    response.cookies.set(names.challenge, '', { ...options, maxAge: 0 });
    return response;
  } catch (error) {
    return json({ error: error instanceof RequestError ? error.message : 'Verificação temporariamente indisponível. Tente novamente.' }, error instanceof RequestError ? error.status : 503);
  }
}
