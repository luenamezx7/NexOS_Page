/**
 * Auth API route — handles all Supabase Auth actions.
 *
 * Actions: login, logout, signup, resend, otp, otp-verify, oauth, forgot, reset, factor, enroll, verify
 *
 * Security:
 * - isSameOrigin(req) — rejects cross-origin requests
 * - consumeAttempt() — rate limiting per IP and per email
 * - captchaToken — passed to Supabase (Turnstile validated there, not here)
 * - MFA required for full access (aal2)
 *
 * Email errors are mapped via authEmailFailure() to prevent account enumeration.
 * Welcome email is triggered via after() on successful user-flow authentication.
 */

import { after, NextRequest } from 'next/server';
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
import { authEmailFailure } from '@/lib/auth/email-errors';
import { sendWelcomeIfNeeded } from '@/lib/emails/welcome';
import { isConfirmedDuplicateError, isConfirmedEmailTaken } from '@/lib/auth/signup';
import { isRecoveryTokenHash } from '@/lib/auth/recovery';

// Supplemental per-instance limit. Supabase Auth also enforces its own limits.
const attempts = new Map<string, { count: number; until: number }>();
const emailSchema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email().max(254)), captcha: z.string().max(2048).optional(), callbackUrl: z.string().max(512).optional() });
const loginSchema = emailSchema.extend({ password: z.string().min(1).max(256) });

// Machine-readable reason for every reset rejection, so a support report can
// identify the exact step that failed without exposing provider internals.
const RESET_CODES = {
  password: 'RESET_PASSWORD_INVALID',
  rateLimited: 'RESET_RATE_LIMITED',
  captchaUnavailable: 'RESET_CAPTCHA_UNAVAILABLE',
  captchaFailed: 'RESET_CAPTCHA_FAILED',
  linkInvalid: 'RESET_LINK_INVALID',
  sessionInvalid: 'RESET_SESSION_INVALID',
  reauthRequired: 'RESET_REAUTH_REQUIRED',
  updateFailed: 'RESET_UPDATE_FAILED',
} as const;

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
        if (!captcha) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://nexoslab.online';
      const redirectTo = new URL('/auth/callback', site);
      redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
      redirectTo.searchParams.set('next', '/portal/redefinir');
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo.toString(), captchaToken: captcha });
      const failure = authEmailFailure(error);
      if (failure) {
        console.error('[api/auth] email request failed', { action, code: error?.code, status: error?.status });
        return privateJson({ error: failure.error }, failure.status);
      }
      return privateJson({
        message:
          'Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. O link expira em pouco tempo — confira também o spam.',
      });
    }
    if (action === 'reset') {
      // Verify the email link only on submission, so email scanners cannot consume it.
      const resetParsed = z
        .object({ password: z.string().min(12).max(256), captcha: z.string().max(2048).optional(), tokenHash: z.string().refine(isRecoveryTokenHash).optional(), currentPassword: z.string().min(1).max(256).optional() })
        .safeParse(body);
      if (!resetParsed.success) {
        return privateJson({ error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.', code: RESET_CODES.password }, 400);
      }
      if (!evaluatePassword(resetParsed.data.password).acceptable) {
        return privateJson({ error: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.', code: RESET_CODES.password }, 400);
      }
      if (!(await consumeAttempt(`auth:account:reset:${ip}`, 5, 900))) {
        return privateJson({ error: 'Não foi possível concluir. Aguarde alguns minutos.', code: RESET_CODES.rateLimited }, 429);
      }
      if (isTurnstileEnforced()) {
        if (!isTurnstileConfigured()) {
          return privateJson({ error: 'Verificação de segurança indisponível. Contate a equipe.', code: RESET_CODES.captchaUnavailable }, 503);
        }
        if (!resetParsed.data.captcha || !(await verifyTurnstileToken(resetParsed.data.captcha)).success) {
          return privateJson({ error: 'Confirme a verificação de segurança.', code: RESET_CODES.captchaFailed }, 400);
        }
      }
      let recoveryVerified = false;
      if (resetParsed.data.tokenHash) {
        const { data, error } = await client.auth.verifyOtp({ token_hash: resetParsed.data.tokenHash, type: 'recovery' });
        if (error || !data.session || !data.user || data.user.is_anonymous) {
          console.error('[api/auth] recovery verification failed', { code: error?.code, status: error?.status });
          return privateJson({ error: 'Link de redefinição inválido ou expirado. Solicite um novo link em Esqueceu a senha.', code: RESET_CODES.linkInvalid }, 401);
        }
        recoveryVerified = true;
      }
      const { data: sessionUser, error: sessionError } = await client.auth.getUser();
      if (sessionError || !sessionUser.user || sessionUser.user.is_anonymous) {
        console.error('[api/auth] recovery session missing', { code: sessionError?.code, status: sessionError?.status });
        return privateJson({ error: 'Sessão de recuperação inválida ou expirada. Solicite um novo link.', code: RESET_CODES.sessionInvalid }, 401);
      }
      // Com MFA habilitado o GoTrue recusa trocar a senha fora de sessão aal2
      // (`insufficient_aal`), e a sessão criada por um link de recuperação é aal1 —
      // MFA não pode ser satisfeito por link. Quando o token de uso único foi
      // verificado acima, a posse do e-mail já é a credencial pedida por um reset,
      // então a gravação usa service_role. A exigência de MFA continua valendo em
      // qualquer outro caminho: sessão comum continua por `updateUser`.
      if (!recoveryVerified && !resetParsed.data.currentPassword) {
        return privateJson({ error: 'Confirme a senha atual para definir uma nova senha.', code: RESET_CODES.reauthRequired }, 400);
      }
      if (!recoveryVerified && !(await consumeAttempt(`auth:account:reset:pwd:${sessionUser.user.id}`, 5, 900))) {
        return privateJson({ error: 'Muitas tentativas. Aguarde alguns minutos.', code: RESET_CODES.rateLimited }, 429);
      }
      const { error: updateError } = recoveryVerified
        ? await createAdminClient().auth.admin.updateUserById(sessionUser.user.id, { password: resetParsed.data.password })
        : await client.auth.updateUser({
            password: resetParsed.data.password,
            ...(resetParsed.data.currentPassword ? { current_password: resetParsed.data.currentPassword } : {}),
          });
      if (updateError) {
        console.error('[api/auth] reset failed', { code: updateError.code, status: updateError.status, message: updateError.message, recoveryVerified });
        const error =
          updateError.code === 'same_password'
            ? 'A nova senha precisa ser diferente da senha atual.'
            : updateError.code === 'weak_password'
              ? 'Escolha uma senha mais forte e tente novamente.'
              : updateError.code === 'insufficient_aal'
                ? 'Sua conta usa verificação em duas etapas. Entre na sua conta, confirme o segundo fator e redefina a senha por lá.'
                : updateError.code === 'validation_failed'
                  ? 'A senha não foi aceita. Escolha outra combinação de caracteres.'
                  : updateError.code === 'reauthentication_needed'
                    ? 'Não foi possível confirmar sua senha atual. Solicite um link em “Esqueceu a senha”.'
                    : updateError.code === 'session_not_found' || updateError.code === 'session_expired'
                      ? 'Sua sessão expirou. Entre novamente e repita.'
                      : updateError.code === 'over_request_rate_limit'
                        ? 'Muitas tentativas. Aguarde alguns minutos.'
                        : 'Não foi possível salvar a nova senha. Tente novamente.';
        return privateJson({ error, recoveryVerified, code: RESET_CODES.updateFailed }, 400);
      }
      // Força novo login com a senha atualizada (e MFA quando exigido).
      await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      return privateJson({ ok: true, message: 'Senha redefinida com sucesso. Entre com a nova senha.' });
    }
    if (action === 'otp-verify') {
      const otpParsed = z.object({ email: z.email().max(254), token: z.string().regex(/^\d{6,8}$/) }).safeParse(body);
      if (!otpParsed.success) return privateJson({ error: 'Informe o código de 6 a 8 dígitos recebido por e-mail.' }, 400);
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
        // Validation belongs to Supabase Auth; Turnstile tokens cannot be used twice.
        if (!captcha) return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
      }
      if (action === 'otp') {
        // Sempre resposta genérica — não revela existência da conta (anti-enumeration).
        const redirectTo = new URL('/auth/callback', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url);
        redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
        redirectTo.searchParams.set('next', sanitizeCallbackPath(parsed.data.callbackUrl) ?? (userFlow ? '/conta' : '/dashboard'));
        const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo.toString(), captchaToken: captcha } });
        const failure = authEmailFailure(error);
        if (failure) {
          console.error('[api/auth] email request failed', { action, code: error?.code, status: error?.status });
          return privateJson({ error: failure.error }, failure.status);
        }
        return privateJson({ message: 'Se houver uma conta ativa para este e-mail, você receberá um código de acesso. Confira também o spam.' });
      }
      if (action === 'signup' || action === 'resend') {
        if (action === 'signup' && await isConfirmedEmailTaken(email, createAdminClient())) {
          // This branch skips signUp, so validate CAPTCHA here exactly once.
          if (isTurnstileEnforced() && !(await verifyTurnstileToken(captcha ?? '')).success) {
            return privateJson({ error: 'Confirme a verificação de segurança.' }, 400);
          }
          return privateJson({ error: 'O E-mail já está em uso.', code: 'EMAIL_IN_USE' }, 409);
        }
        const redirectTo = new URL('/auth/callback', process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || req.url);
        redirectTo.searchParams.set('entry', userFlow ? '/portal/acesso' : '/admin-dashboard-su/secure-entry');
        redirectTo.searchParams.set('next', sanitizeCallbackPath(parsed.data.callbackUrl) ?? (userFlow ? '/conta' : '/dashboard'));
        const emailRedirectTo = redirectTo.toString();
        const result = action === 'signup'
          ? await client.auth.signUp({ email, password, options: { emailRedirectTo, captchaToken: captcha } })
          : await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo, captchaToken: captcha } });
        // Covers a signup that raced the index check, for confirmed accounts only.
        if (action === 'signup' && isConfirmedDuplicateError(result.error)) {
          return privateJson({ error: 'O E-mail já está em uso.', code: 'EMAIL_IN_USE' }, 409);
        }
        const failure = authEmailFailure(result.error);
        if (failure) {
          console.error('[api/auth] email request failed', { action, code: result.error?.code, status: result.error?.status });
          return privateJson({ error: failure.error }, failure.status);
        }
        if ('session' in result.data && result.data.session) await client.auth.signOut({ scope: 'local' });
        return privateJson({ message: 'Se o endereço estiver apto, você receberá um e-mail de confirmação. Confira também o spam e depois entre na sua conta.' });
      }
      const { error } = await client.auth.signInWithPassword({ email, password, options: { captchaToken: captcha } });
      if (error) {
        const failure = error.code === 'invalid_credentials' || error.code === 'email_not_confirmed' ? null : authEmailFailure(error);
        return privateJson({ error: failure?.error ?? 'Não foi possível entrar com essas credenciais. Confira também a confirmação do e-mail.' }, failure?.status ?? 401);
      }
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
      if (userFlow && verified.ok) after(() => sendWelcomeIfNeeded(access.userId));
      return verified.ok ? privateJson({ ok: true }) : privateJson({ error: 'Não foi possível validar a sessão.' }, 403);
    }
    const fullAccess = await checkAccess();
    if (fullAccess.ok) {
      if (userFlow) after(() => sendWelcomeIfNeeded(access.userId));
      return privateJson({ ok: true });
    }
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
    console.error('[api/auth] request failed', { action, name: error instanceof Error ? error.name : 'UnknownError' });
    return privateJson({ error: 'Não foi possível concluir. Tente novamente em instantes.' }, 503);
  }
}
