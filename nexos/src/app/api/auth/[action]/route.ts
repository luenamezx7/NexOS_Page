import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminAccess, privateJson } from '@/lib/auth/admin';
import { isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHmac } from 'node:crypto';

// Supplemental per-instance limit. Supabase Auth also enforces its own limits.
const attempts = new Map<string, { count: number; until: number }>();
const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(256), captcha: z.string().max(2048).optional() });

export async function POST(req: NextRequest, context: { params: Promise<{ action: string }> }) {
  const expectedOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? req.url).origin;
  if (req.headers.get('origin') !== expectedOrigin || req.headers.get('sec-fetch-site') === 'cross-site') {
    return privateJson({ error: 'Origem inválida.' }, 403);
  }
  const { action } = await context.params;
  if (!['login', 'logout', 'factor', 'enroll', 'verify'].includes(action)) return privateJson({ error: 'Rota inválida.' }, 404);
  const now = Date.now();
  for (const [key, bucket] of attempts) if (bucket.until <= now) attempts.delete(key);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${action}:${ip}`;
  const bucket = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  if (bucket.count >= 10 || attempts.size >= 10000) return privateJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429);
  attempts.set(key, { ...bucket, count: bucket.count + 1 });
  try {
    const text = await req.text();
    if (text.length > 4096) return privateJson({ error: 'Dados excessivos.' }, 413);
    const body: unknown = text ? JSON.parse(text) : {};
    if (action !== 'logout') {
      const db = createAdminClient();
      const rateKey = createHmac('sha256', process.env.SUPABASE_SECRET_KEY!).update(`auth:${action}:${ip}`).digest('hex');
      const { data: allowed, error } = await db.rpc('consume_auth_attempt', { p_key: rateKey, p_limit: 10, p_window_seconds: 60 });
      if (error) throw error;
      if (!allowed) return privateJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429);
    }
    const client = await createClient();
    if (action === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      return error ? privateJson({ error: 'Não foi possível sair. Tente novamente.' }, 503) : privateJson({ ok: true });
    }
    if (action === 'login') {
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) return privateJson({ error: 'Confira o e-mail e a senha.' }, 400);
      const { email, password, captcha } = parsed.data;
      const accountKey = createHmac('sha256', process.env.SUPABASE_SECRET_KEY!).update(`auth:account:${email.toLowerCase()}`).digest('hex');
      const accountLimit = await createAdminClient().rpc('consume_auth_attempt', { p_key: accountKey, p_limit: 10, p_window_seconds: 900 });
      if (accountLimit.error) throw accountLimit.error;
      if (!accountLimit.data) return privateJson({ error: 'Não foi possível entrar. Aguarde alguns minutos.' }, 429);
      if (isTurnstileEnforced()) {
        if (!captcha || !(await verifyTurnstileToken(captcha)).success) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return privateJson({ error: 'Não foi possível entrar com essas credenciais.' }, 401);
    }
    const access = await getAdminAccess(false);
    if (!access.ok) {
      await client.auth.signOut({ scope: 'local' });
      return privateJson({ error: access.status === 503 ? 'Acesso administrativo indisponível. Contate o responsável.' : 'Acesso não autorizado.' }, access.status);
    }
    if (action === 'verify') {
      const parsed = z.object({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).safeParse(body);
      if (!parsed.success) return privateJson({ error: 'Informe o código de seis dígitos.' }, 400);
      const { error } = await client.auth.mfa.challengeAndVerify(parsed.data);
      if (error) return privateJson({ error: 'Código inválido ou expirado. Tente novamente.' }, 400);
      const verified = await getAdminAccess();
      return verified.ok ? privateJson({ ok: true }) : privateJson({ error: 'Não foi possível validar a sessão.' }, 403);
    }
    const fullAccess = await getAdminAccess();
    if (fullAccess.ok) return privateJson({ ok: true });
    const factors = await client.auth.mfa.listFactors();
    if (factors.error) throw factors.error;
    if (factors.data.totp.length) return privateJson({ factorId: factors.data.totp[0].id });
    if (action !== 'enroll') return privateJson({ enrollmentRequired: true });
    for (const factor of factors.data.all) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') {
        const { error } = await client.auth.mfa.unenroll({ factorId: factor.id });
        if (error) throw error;
      }
    }
    const enrollment = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'NexOS Admin', issuer: 'NexOS' });
    if (enrollment.error) throw enrollment.error;
    return privateJson({ factorId: enrollment.data.id, qr: enrollment.data.totp.qr_code, secret: enrollment.data.totp.secret });
  } catch {
    return privateJson({ error: 'Não foi possível concluir. Tente novamente em instantes.' }, 503);
  }
}
