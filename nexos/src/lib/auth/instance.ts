import 'server-only';
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { twoFactor, admin as adminPlugin, captcha } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { createPool } from '@/lib/auth/db';
import { PostgresDialect } from 'kysely';
import { sendVerificationEmail, sendResetPasswordEmail } from '@/lib/auth/mailer';

/**
 * Instância do Better Auth — autoridade única de identidade e sessão.
 *
 * Divisão de responsabilidades:
 * - AUTENTICAÇÃO: credenciais, OAuth, OTP, 2FA (esta instância)
 * - SESSÃO: cookie httpOnly persistido no Postgres, revogável (esta instância)
 * - AUTORIZAÇÃO: permissões da aplicação (ver `session.ts`, sempre no servidor)
 */

function required(name: string, value: string | undefined, minLength = 0): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${name} ausente: configure no ambiente antes de iniciar o servidor.`);
  if (trimmed.length < minLength) throw new Error(`${name} precisa de ao menos ${minLength} caracteres.`);
  return trimmed;
}

/**
 * Origens confiáveis. `SITE_URL` é a origem canônica; localhost entra apenas em
 * desenvolvimento. Sem curinga: origem ampla transformaria o CSRF em decorativo.
 */
function trustedOrigins(): string[] {
  const site = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  const origins = new Set<string>();
  if (site) origins.add(site);
  if (process.env.NODE_ENV !== 'production') {
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:3000');
  }
  if (origins.size === 0) throw new Error('SITE_URL ausente: o Better Auth não consegue validar a origem das requisições.');
  return [...origins];
}

/** Só declara o provider quando as credenciais existem — o botão some, não explode. */
function socialProviders() {
  const providers: {
    google?: { clientId: string; clientSecret: string; prompt: 'select_account'; mapProfileToUser: (profile: { name?: string; picture?: string }) => { name?: string; image?: string } };
    github?: { clientId: string; clientSecret: string };
  } = {};

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (googleId && googleSecret) {
    providers.google = {
      clientId: googleId,
      clientSecret: googleSecret,
      // Consentimento a cada login: sem isso, uma sessão Google já viva no
      // navegador entraria sem passar pela auditoria de fatores da conta.
      prompt: 'select_account',
      mapProfileToUser: (profile) => ({ name: profile.name, image: profile.picture }),
    };
  }

  const githubId = process.env.GITHUB_CLIENT_ID?.trim();
  const githubSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (githubId && githubSecret) {
    providers.github = { clientId: githubId, clientSecret: githubSecret };
  }

  return providers;
}

const turnstileSecret = process.env.TURNSTILE_SECRET_KEY?.trim();

/**
 * Controle de acesso do plugin admin.
 *
 * As permissões finas da aplicação são decididas em `session.ts`, sempre no
 * servidor. Aqui ficam as capacidades do papel, para que o próprio Better Auth
 * possa responder `userHasPermission` sem lógica duplicada.
 */
const accessControl = createAccessControl({
  adminPanel: ['view', 'manageUsers', 'impersonate'] as const,
});

/**
 * Instância do Better Auth, criada no primeiro uso.
 *
 * O Next importa este módulo durante `next build` (para coletar dados de
 * página) e validações de ambiente não deveriam decidir se o build passa:
 * `BETTER_AUTH_SECRET` e `DATABASE_URL` são segredos de runtime. Configuração
 * incorreta precisa falhar no primeiro request, com mensagem clara, e não
 * derrubar o build de todos os ambientes que não compartilham os segredos.
 */
type Auth = ReturnType<typeof createAuth>;

let instance: Auth | null = null;

export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

function createAuth() {
  return betterAuth({
  // Dialect com pool sob demanda: o Next importa este módulo durante o build e
  // `DATABASE_URL` é segredo de runtime, não de build. Ver src/lib/auth/db.ts.
  database: new PostgresDialect({ pool: async () => createPool() }),
  secret: required('BETTER_AUTH_SECRET', process.env.BETTER_AUTH_SECRET, 32),
  baseURL: (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, ''),
  basePath: '/api/auth',
  trustedOrigins: trustedOrigins(),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 256,
    requireEmailVerification: true,
    // Trocar a senha invalida as sessões abertas: reduz a janela de sequestro.
    revokeSessionsOnPasswordReset: true,
    autoSignIn: false,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
      await sendVerificationEmail({ to: user.email, url, name: user.name });
    },
    expiresIn: 60 * 60,
    autoSignInAfterVerification: false,
  },

  sendResetPassword: async ({ user, url }: { user: { email: string; name?: string | null }; url: string }) => {
    await sendResetPasswordEmail({ to: user.email, url, name: user.name });
  },

  socialProviders: socialProviders(),

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    // Cache de cookie manteria a sessão aparentemente válida depois da revogação
    // no servidor. Operações sensíveis consultam o Postgres — ver `session.ts`.
    cookieCache: { enabled: false },
  },

  // Dispara o e-mail de boas-vindas na transição emailVerified: false -> true.
  // O gancho de update é o único ponto em que a confirmação acontece, já que a
  // rota de callback do GoTrue deixou de existir.
  databaseHooks: {
    user: {
      update: {
        after: async (updated) => {
          if (updated.emailVerified === true) {
            const { sendWelcomeIfNeeded } = await import('@/lib/emails/welcome');
            await sendWelcomeIfNeeded(String(updated.id), updated.email);
          }
        },
      },
    },
  },

  advanced: {
    // UUID mantém os IDs válidos para as colunas uuid já existentes nos dados.
    database: { generateId: 'uuid' },
    useSecureCookies: process.env.NODE_ENV === 'production',
    cookiePrefix: 'nexos',
  },

  // Limites persistidos no Postgres: instâncias serverless não compartilham memória.
  rateLimit: {
    enabled: true,
    window: 60,
    storage: 'database',
    customRules: {
      '/sign-in/email': { window: 900, max: 10 },
      '/sign-up/email': { window: 900, max: 3 },
      '/forget-password': { window: 900, max: 3 },
      '/send-verification-email': { window: 900, max: 3 },
      '/two-factor/verify-totp': { window: 300, max: 5 },
    },
  },

  plugins: [
    // MFA preservado (TOTP) — continua obrigatório para acesso pleno.
    twoFactor({
      issuer: 'NexOS',
      totp: { skipVerificationOnEnable: false },
      backupCodes: { enabled: true, amount: 10, prefix: 'nexos-' },
      otp: { enabled: false },
    }),
    // Papéis no banco substituem a allowlist por UUID em variável de ambiente.
    // Conceder ou revogar acesso passa a ser uma alteração de dado, não um redeploy.
    adminPlugin({
      defaultRole: 'user',
      adminRoles: ['admin'],
      roles: {
        user: accessControl.newRole({}),
        admin: accessControl.newRole({ adminPanel: ['view', 'manageUsers', 'impersonate'] }),
      },
    }),
    // CAPTCHA só nos endpoints que Enviam e-mail ou abrem sessão.
    ...(turnstileSecret
      ? [
          captcha({
            provider: 'cloudflare-turnstile',
            secretKey: turnstileSecret,
            endpoints: ['/sign-in/email', '/sign-up/email', '/forget-password', '/send-verification-email'],
          }),
        ]
      : []),
    // Deve ser o ÚLTIMO plugin: propaga os cookies de toda resposta para o Next.
    nextCookies(),
  ],
});
}
