import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getAdminAccess, privateJson } from '@/lib/auth/admin';
import { isTurnstileConfigured, isTurnstileEnforced, verifyTurnstileToken } from '@/lib/turnstile';
import { createAdminClient } from '@/lib/supabase/admin';
import { createHmac } from 'node:crypto';
import { getUserAccess } from '@/lib/auth/user';
import { isSameOrigin, readJsonBody, RequestError } from '@/lib/request-security';
import { evaluatePassword } from '@/lib/auth/password-strength';
import { sanitizeCallbackPath } from '@/lib/auth/callback';

// Supplemental per-instance limit. Supabase Auth also enforces its own limits.
const attempts = new Map<string, { count: number; until: number }>();
const emailSchema = z.object({ email: z.email().max(254), captcha: z.string().max(2048).optional(), callbackUrl: z.string().max(512).optional() });
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
  const allowedActions = userFlow
    ? ['login', 'logout', 'factor', 'enroll', 'verify', 'signup', 'resend', 'otp', 'otp-verify', 'oauth', 'forgot', 'reset']
    : ['login', 'logout', 'factor', 'enroll', 'verify', 'oauth', 'forgot', 'reset'];
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
    if (action === 'oauth') {
      // Login social (Google/GitHub): gera a URL de authorize do Supabase e
      // devolve para o client navegar. O callback volta em /auth/callback.
      const oauthSchema = z.object({
        provider: z.enum(['google', 'github']),
        callbackUrl: z.string().max(512).optional(),
      });
      const oauthParsed = oauthSchema.safeParse(body);
      if (!oauthParsed.success) return privateJson({ error: 'Provedor inválido.' }, 400);
      if (!(await consumeAttempt(`auth:account:oauth:${ip}`, 10, 900))) return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url;
      const redirectTo = new URL('/auth/callback', site);
      redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
      const cb = sanitizeCallbackPath(oauthParsed.data.callbackUrl);
      redirectTo.searchParams.set('next', cb ?? (userFlow ? '/conta' : '/dashboard'));
      const { data, error } = await client.auth.signInWithOAuth({
        provider: oauthParsed.data.provider,
        options: { redirectTo: redirectTo.toString(), skipBrowserRedirect: true },
      });
      if (error || !data.url) {
        if (process.env.NODE_ENV !== 'production') console.error('[api/auth] oauth:', error?.message ?? 'URL ausente');
        return privateJson({ error: 'Não foi possível iniciar o acesso social. Tente novamente.' }, 503);
      }
      return privateJson({ url: data.url });
    }
    if (action === 'forgot') {
      // Recuperação de senha: resposta sempre genérica (anti-enumeration).
      const forgotParsed = emailSchema.safeParse(body);
      if (!forgotParsed.success) return privateJson({ error: 'Informe um e-mail válido.' }, 400);
      const { email, captcha } = forgotParsed.data;
      if (!(await consumeAttempt(`auth:account:forgot:${email.toLowerCase()}`, 3, 900))) {
        return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      }
      if (isTurnstileEnforced()) {
        if (!isTurnstileConfigured()) return privateJson({ error: 'Verificação de segurança indisponível. Contate a equipe.' }, 503);
        if (!captcha || !(await verifyTurnstileToken(captcha)).success) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url;
      const redirectTo = new URL('/auth/callback', site);
      redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
      redirectTo.searchParams.set('next', '/portal/redefinir');
      await client.auth
        .resetPasswordForEmail(email, { redirectTo: redirectTo.toString() })
        .catch(() => undefined);
      return privateJson({
        message:
          'Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. O link expira em pouco tempo — confira também o spam.',
      });
    }
    if (action === 'reset') {
      // Sessão de recovery estabelecida pelo /auth/callback (troca de code).
      const resetParsed = z
        .object({ password: z.string().min(12).max(256), captcha: z.string().max(2048).optional() })
        .safeParse(body);
      if (!resetParsed.success) {
        return privateJson({ error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.' }, 400);
      }
      if (!evaluatePassword(resetParsed.data.password).acceptable) {
        return privateJson({ error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.' }, 400);
      }
      if (!(await consumeAttempt(`auth:account:reset:${ip}`, 5, 900))) {
        return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      }
      if (isTurnstileEnforced()) {
        if (!isTurnstileConfigured()) return privateJson({ error: 'Verificação de segurança indisponível. Contate a equipe.' }, 503);
        if (!resetParsed.data.captcha || !(await verifyTurnstileToken(resetParsed.data.captcha)).success) {
          return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
        }
      }
      const { data: sessionUser, error: sessionError } = await client.auth.getUser();
      if (sessionError || !sessionUser.user || sessionUser.user.is_anonymous) {
        return privateJson({ error: 'Sessão de recuperação inválida ou expirada. Solicite um novo link.' }, 401);
      }
      const { error: updateError } = await client.auth.updateUser({ password: resetParsed.data.password });
      if (updateError) {
        if (process.env.NODE_ENV !== 'production') console.error('[api/auth] reset:', updateError.message);
        return privateJson({ error: 'Não foi possível redefinir a senha. Solicite um novo link.' }, 400);
      }
      // Força novo login com a senha atualizada (e MFA quando exigido).
      await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      return privateJson({ ok: true, message: 'Senha redefinida com sucesso. Entre com a nova senha.' });
    }
    if (action === 'otp-verify') {
      const otpParsed = z.object({ email: z.email().max(254), token: z.string().regex(/^\d{6}$/) }).safeParse(body);
      if (!otpParsed.success) return privateJson({ error: 'Informe o código de seis dígitos.' }, 400);
      const { email, token } = otpParsed.data;
      if (!(await consumeAttempt(`auth:account:otp-verify:${email.toLowerCase()}`, 10, 900))) return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      const { error } = await client.auth.verifyOtp({ email, token, type: 'email' });
      if (error) return privateJson({ error: 'Código inválido ou expirado. Solicite outro.' }, 401);
    } else if (['login', 'signup', 'resend', 'otp'].includes(action)) {
      const schema = action === 'resend' || action === 'otp' ? emailSchema : action === 'signup' ? loginSchema.extend({ password: z.string().min(12).max(256) }) : loginSchema;
      const parsed = schema.safeParse(body);
      if (!parsed.success) return privateJson({ error: 'Confira o e-mail e a senha.' }, 400);
      const { email, captcha } = parsed.data;
      const password = 'password' in parsed.data ? parsed.data.password as string : '';
      if (action === 'signup' && !evaluatePassword(password).acceptable) {
        return privateJson({ error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.' }, 400);
      }
      if (!(await consumeAttempt(`auth:account:${action}:${email.toLowerCase()}`, action === 'login' ? 10 : 3, 900))) return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.' }, 429);
      if (isTurnstileEnforced()) {
        if (!isTurnstileConfigured()) return privateJson({ error: 'Verificação de segurança indisponível. Contate a equipe.' }, 503);
        if (!captcha || !(await verifyTurnstileToken(captcha)).success) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      if (action === 'otp') {
        // Sempre resposta genérica — não revela existência da conta (anti-enumeration).
        const redirectTo = new URL('/auth/callback', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url);
        redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
        redirectTo.searchParams.set('next', sanitizeCallbackPath(parsed.data.callbackUrl) ?? (userFlow ? '/conta' : '/dashboard'));
        await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo.toString() } }).catch(() => undefined);
        return privateJson({ message: 'Se houver uma conta ativa para este e-mail, você receberá um código de 6 dígitos. Confira também o spam.' });
      }
      if (action === 'signup' || action === 'resend') {
        const redirectTo = new URL('/auth/callback', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url);
        redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
        redirectTo.searchParams.set('next', sanitizeCallbackPath(parsed.data.callbackUrl) ?? (userFlow ? '/conta' : '/dashboard'));
        const emailRedirectTo = redirectTo.toString();
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
