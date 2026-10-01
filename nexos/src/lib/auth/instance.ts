import 'server-only';
import { randomUUID } from 'node:crypto';
import { betterAuth } from 'better-auth';
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor, admin as adminPlugin, captcha, magicLink } from 'better-auth/plugins';
import { passkey } from '@better-auth/passkey';
import { createAccessControl } from 'better-auth/plugins/access';
import { PostgresDialect } from 'kysely';
import type { Pool } from 'pg';
import { createPool } from './db';
import { sendVerificationEmail, sendResetPasswordEmail, sendMagicLinkEmail } from './mailer';
import { verifyMigratedPassword } from './password';
import { evaluatePassword } from './password-strength';
import { isTurnstileEnforced } from '@/lib/turnstile';
import { securityPlugin } from './security-plugin';
import { enqueueNotification } from '@/lib/emails/notifications';

function required(name: string, value: string | undefined, minLength = 0): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < minLength) throw new Error(`${name} ausente ou inválida no servidor.`);
  return trimmed;
}

function socialProviders() {
  const providers: { google?: { clientId: string; clientSecret: string; prompt: 'select_account' }; github?: { clientId: string; clientSecret: string } } = {};
  if (process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()) {
    providers.google = { clientId: process.env.GOOGLE_CLIENT_ID.trim(), clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(), prompt: 'select_account' };
  }
  if (process.env.GITHUB_CLIENT_ID?.trim() && process.env.GITHUB_CLIENT_SECRET?.trim()) {
    providers.github = { clientId: process.env.GITHUB_CLIENT_ID.trim(), clientSecret: process.env.GITHUB_CLIENT_SECRET.trim() };
  }
  return providers;
}

const ac = createAccessControl({ adminPanel: ['view', 'manageUsers', 'impersonate'] as const });
const CAPTCHA_PATHS = ['/sign-in/email', '/sign-up/email', '/request-password-reset', '/send-verification-email', '/sign-in/magic-link'];

/** Injeção explícita somente para testes isolados; getAuth usa o ambiente real. */
export interface AuthTestOptions {
  pool?: Pool;
  siteURL?: string;
  secret?: string;
  notifications?: boolean;
  captchaEnabled?: boolean;
  socialProviders?: ReturnType<typeof socialProviders>;
  mail?: {
    verification: typeof sendVerificationEmail;
    reset: typeof sendResetPasswordEmail;
    magic: typeof sendMagicLinkEmail;
  };
}

export function createAuth(test: AuthTestOptions = {}) {
  const site = new URL(required('SITE_URL', test.siteURL ?? process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL)).origin;
  const secret = required('BETTER_AUTH_SECRET', test.secret ?? process.env.BETTER_AUTH_SECRET, 32);
  const captchaEnabled = test.captchaEnabled ?? isTurnstileEnforced();
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const notifications = test.notifications !== false;
  const mail = test.mail ?? { verification: sendVerificationEmail, reset: sendResetPasswordEmail, magic: sendMagicLinkEmail };
  return betterAuth({
    appName: 'NexOS',
    database: new PostgresDialect({ pool: test.pool ?? (async () => createPool()) }),
    secret, baseURL: site, basePath: '/api/auth', trustedOrigins: [site],
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 256,
      requireEmailVerification: true, revokeSessionsOnPasswordReset: true, autoSignIn: false,
      password: { verify: verifyMigratedPassword },
      sendResetPassword: async ({ user, url }) => mail.reset({ to: user.email, url, name: user.name }),
      resetPasswordTokenExpiresIn: 3600,
      onPasswordReset: async ({ user }) => {
        if (notifications) await enqueueNotification(user.id, `reset/${randomUUID()}`, {
          kind: 'security', name: user.name, detail: 'Sua senha foi redefinida. As sessões anteriores foram encerradas.',
        });
      },
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => mail.verification({ to: user.email, url, name: user.name }),
      expiresIn: 3600, autoSignInAfterVerification: false, sendOnSignUp: true,
      afterEmailVerification: async user => {
        if (notifications) {
          const { sendWelcomeIfNeeded } = await import('@/lib/emails/welcome');
          await sendWelcomeIfNeeded(user.id);
        }
      },
    },
    socialProviders: test.socialProviders ?? socialProviders(),
    session: { expiresIn: 604800, updateAge: 86400, cookieCache: { enabled: false } },
    hooks: {
      before: createAuthMiddleware(async ctx => {
        if (ctx.path === '/passkey/verify-registration' || ctx.path === '/passkey/verify-authentication') {
          const credential = ctx.body?.response;
          const response = credential?.response;
          const bounded = (value: unknown, max = 32768) => typeof value === 'string' && value.length > 0 && value.length <= max;
          if (!credential || !bounded(credential.id, 4096) || !bounded(credential.rawId, 4096) ||
            credential.type !== 'public-key' || !response || !bounded(response.clientDataJSON) ||
            (ctx.path === '/passkey/verify-registration' ? !bounded(response.attestationObject) :
              !bounded(response.authenticatorData) || !bounded(response.signature, 8192))) {
            throw new APIError('BAD_REQUEST', { code: 'INVALID_WEBAUTHN_RESPONSE', message: 'Resposta da chave de acesso inválida.' });
          }
        }
        if (ctx.path.startsWith('/admin/') || ctx.path === '/two-factor/disable') {
          const current = await getSessionFromCtx(ctx);
          if (ctx.path.startsWith('/admin/') && current?.user.twoFactorEnabled !== true) {
            throw new APIError('FORBIDDEN', { code: 'MFA_REQUIRED', message: 'Autenticação em duas etapas obrigatória.' });
          }
          if (ctx.path === '/two-factor/disable' && current?.user.role === 'admin') {
            throw new APIError('FORBIDDEN', { message: 'Operadores precisam manter a autenticação em duas etapas ativa.' });
          }
        }
        if (CAPTCHA_PATHS.includes(ctx.path) && captchaEnabled && !turnstileSecret) {
          throw new APIError('SERVICE_UNAVAILABLE', { code: 'SECURITY_UNAVAILABLE', message: 'Verificação de segurança indisponível.' });
        }
        const password = ctx.path === '/sign-up/email' ? ctx.body?.password :
          ['/reset-password', '/change-password', '/set-password'].includes(ctx.path) ? ctx.body?.newPassword : undefined;
        if (password !== undefined && (typeof password !== 'string' || !evaluatePassword(password).acceptable)) {
          throw new APIError('BAD_REQUEST', { code: 'WEAK_PASSWORD', message: 'A senha precisa de: 12+ caracteres, maiúscula, minúscula, número e símbolo.' });
        }
        // Confiar no dispositivo não é permitido: cada novo login pede TOTP.
        if (ctx.path.startsWith('/two-factor/') && ctx.body?.trustDevice === true) {
          throw new APIError('BAD_REQUEST', { message: 'Confirme o segundo fator a cada acesso.' });
        }
      }),
    },
    advanced: {
      database: { generateId: 'uuid' },
      useSecureCookies: site.startsWith('https://'), cookiePrefix: 'nexos',
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: site.startsWith('https://') },
    },
    rateLimit: {
      enabled: true, window: 60, max: 100, storage: 'database',
      customRules: {
        '/sign-in/email': { window: 900, max: 10 }, '/sign-up/email': { window: 900, max: 3 },
        '/request-password-reset': { window: 900, max: 3 }, '/send-verification-email': { window: 900, max: 3 },
        '/sign-in/magic-link': { window: 900, max: 3 },
        '/two-factor/verify-totp': { window: 300, max: 5 },
        '/two-factor/verify-backup-code': { window: 300, max: 5 },
      },
    },
    plugins: [
      twoFactor({ issuer: 'NexOS', allowPasswordless: true, skipVerificationOnEnable: false,
        backupCodeOptions: { amount: 10, storeBackupCodes: 'encrypted' } }),
      adminPlugin({ defaultRole: 'user', adminRoles: ['admin'], roles: {
        user: ac.newRole({}), admin: ac.newRole({ adminPanel: ['view', 'manageUsers', 'impersonate'] }),
      } }),
      magicLink({ expiresIn: 600, storeToken: 'hashed', disableSignUp: true,
        sendMagicLink: async ({ email, url }) => mail.magic({ to: email, url }) }),
      passkey({ rpName: 'NexOS', rpID: new URL(site).hostname, origin: site,
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        registration: { afterVerification: async ({ verification }) => {
          if (!verification.registrationInfo?.userVerified) throw new APIError('BAD_REQUEST', { message: 'Confirme sua identidade no dispositivo para cadastrar a chave.' });
        } },
        authentication: { afterVerification: async ({ verification }) => {
          if (!verification.authenticationInfo.userVerified) throw new APIError('UNAUTHORIZED', { message: 'Confirme sua identidade no dispositivo para entrar.' });
        } },
      }),
      ...(captchaEnabled && turnstileSecret ? [captcha({ provider: 'cloudflare-turnstile', secretKey: turnstileSecret, endpoints: CAPTCHA_PATHS })] : []),
      securityPlugin(notifications),
      ...(test.pool ? [] : [nextCookies()]),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | null = null;
/** Lazy: segredos e banco são validados no request, não durante next build. */
export function getAuth(): Auth { return instance ??= createAuth(); }
