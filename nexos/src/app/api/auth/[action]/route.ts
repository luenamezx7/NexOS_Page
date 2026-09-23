import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminAccess, privateJson } from '@/lib/auth/admin';
import { isTurnstileConfigured, isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHmac } from 'node:crypto';
import { getUserAccess } from '@/lib/auth/user';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';

// Supplemental per-instance limit. Supabase Auth also enforces its own limits.
const attempts = new Map<string, { count: number; until: number }>();
const emailSchema = z.object({ email: z.email().max(254), captcha: z.string().max(2048).optional() });
const loginSchema = emailSchema.extend({ password: z.string().min(1).max(256) });

async function consumeAttempt(key: string, limit: number, seconds: number) {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error('Rate limit unavailable');
  const hash = createHmac('sha256', secret).update(key).digest('hex');
  const { data, error } = await createAdminClient().rpc('consume_auth_attempt', { p_key: hash, p_limit: limit, p_window_seconds: seconds });
  if (error) throw error;
  return data === true;
}

export async function POST(req: NextRequest, context: { params: Promise<{ action: string }> }) {
  if (!isSameOrigin(req)) {
    return privateJson({ error: 'Origem inválida.' }, 403);
  }
  const { action: routeAction } = await context.params;
  const userFlow = routeAction.startsWith('user-');
  const action = userFlow ? routeAction.slice(5) : routeAction;
  const allowedActions = userFlow ? ['login', 'logout', 'factor', 'enroll', 'verify', 'signup', 'resend'] : ['login', 'logout', 'factor', 'enroll', 'verify'];
  if (!allowedActions.includes(action)) return privateJson({ error: 'Rota inválida.' }, 404);
  const now = Date.now();
  for (const [key, bucket] of attempts) if (bucket.until <= now) attempts.delete(key);
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const key = `${action}:${ip}`;
  const bucket = attempts.get(key) ?? { count: 0, until: now + 60_000 };
  if (bucket.count >= 10 || attempts.size >= 10000) return privateJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429);
  attempts.set(key, { ...bucket, count: bucket.count + 1 });
  try {
    const body = await readJsonBody(req, 8192);
    if (action !== 'logout') {
      if (!(await consumeAttempt(`auth:${action}:${ip}`, 10, 60))) return privateJson({ error: 'Muitas tentativas. Aguarde um minuto.' }, 429);
    }
    const client = await createClient();
    if (action === 'logout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      return error ? privateJson({ error: 'Não foi possível sair. Tente novamente.' }, 503) : privateJson({ ok: true });
    }
    if (['login', 'signup', 'resend'].includes(action)) {
      const schema = action === 'resend' ? emailSchema : action === 'signup' ? loginSchema.extend({ password: z.string().min(12).max(256) }) : loginSchema;
      const parsed = schema.safeParse(body);
      if (!parsed.success) return privateJson({ error: 'Confira o e-mail e a senha.' }, 400);
      const { email, captcha } = parsed.data;
      const password = 'password' in parsed.data ? parsed.data.password as string : '';
      if (!(await consumeAttempt(`auth:account:${action}:${email.toLowerCase()}`, action === 'login' ? 10 : 3, 900))) return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      if (isTurnstileEnforced()) {
        if (!isTurnstileConfigured()) return privateJson({ error: 'Verificação de segurança indisponível. Contate a equipe.' }, 503);
        if (!captcha || !(await verifyTurnstileToken(captcha)).success) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      if (action === 'signup' || action === 'resend') {
        const emailRedirectTo = new URL('/auth/callback', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url).toString();
        const result = action === 'signup'
          ? await client.auth.signUp({ email, password, options: { emailRedirectTo } })
          : await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo } });
        // Never disclose whether an address already has an account.
        if (result.error && (result.error.status ?? 500) >= 500) throw result.error;
        if ('session' in result.data && result.data.session) await client.auth.signOut({ scope: 'local' });
        return privateJson({ message: 'Se o endereço estiver apto, você receberá um e-mail de confirmação. Confira também o spam e depois entre na sua conta.' });
      }
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) return privateJson({ error: 'Não foi possível entrar com essas credenciais.' }, 401);
    }
    const checkAccess = (mfa = true) => userFlow ? getUserAccess(mfa, client) : getAdminAccess(mfa, client);
    const access = await checkAccess(false);
    if (!access.ok) {
      if (access.status !== 503) await client.auth.signOut({ scope: 'local' });
      return privateJson({ error: access.status === 503 ? 'Acesso indisponível. Contate o responsável.' : 'Acesso não autorizado. Confira também a confirmação do seu e-mail.' }, access.status);
    }
    if (!(await consumeAttempt(`auth:mfa:${access.userId}`, 10, 300))) return privateJson({ error: 'Muitas tentativas. Aguarde cinco minutos.' }, 429);
    if (action === 'verify') {
      const parsed = z.object({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).safeParse(body);
      if (!parsed.success) return privateJson({ error: 'Informe o código de seis dígitos.' }, 400);
      const { error } = await client.auth.mfa.challengeAndVerify(parsed.data);
      if (error) return privateJson({ error: 'Código inválido ou expirado. Tente novamente.' }, 400);
      const verified = await checkAccess();
      return verified.ok ? privateJson({ ok: true }) : privateJson({ error: 'Não foi possível validar a sessão.' }, 403);
    }
    const fullAccess = await checkAccess();
    if (fullAccess.ok) return privateJson({ ok: true });
    if (fullAccess.reason !== 'mfa') return privateJson({ error: 'Não foi possível validar a sessão.' }, fullAccess.status);
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
    const enrollment = await client.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'NexOS', issuer: 'NexOS' });
    if (enrollment.error) throw enrollment.error;
    return privateJson({ factorId: enrollment.data.id, qr: enrollment.data.totp.qr_code, secret: enrollment.data.totp.secret });
  } catch (error) {
    if (error instanceof RequestError) return privateJson({ error: error.message }, error.status);
    return privateJson({ error: 'Não foi possível concluir. Tente novamente em instantes.' }, 503);
  }
}
