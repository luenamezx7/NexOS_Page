import 'server-only';
import { randomBytes } from 'node:crypto';
import { createAuthMiddleware } from 'better-auth/api';
import { deleteSessionCookie } from 'better-auth/cookies';
import type { BetterAuthPlugin } from 'better-auth';
import { isMfaSignIn, loginPathFor, mfaDestination } from './policy';
import { enqueueNotification, retryNotifications } from '@/lib/emails/notifications';

/** Após twoFactor: estende o desafio nativo a OAuth, Magic Link e Passkeys. */
export function securityPlugin(notifications = true): BetterAuthPlugin {
  return {
    id: 'nexos-security',
    hooks: { after: [{
      matcher: () => true,
      handler: createAuthMiddleware(async ctx => {
        const issued = ctx.context.newSession;
        // Fora dos databaseHooks: a outbox usa outra conexão e não pode esperar
        // uma FK de usuário ainda não commitada na transação de cadastro.
        if (notifications && issued?.user.emailVerified) {
          const { sendWelcomeIfNeeded } = await import('@/lib/emails/welcome');
          await sendWelcomeIfNeeded(issued.user.id);
        }
        if (issued && isMfaSignIn(ctx.path) && issued.user.twoFactorEnabled === true) {
          const destination = mfaDestination(ctx.context.responseHeaders?.get('location') ?? null, ctx.context.baseURL);
          // Nenhum endpoint deve aceitar a sessão enquanto o TOTP está pendente.
          await ctx.context.internalAdapter.deleteSession(issued.session.token);
          deleteSessionCookie(ctx, true);
          ctx.context.setNewSession(null);
          const identifier = `2fa-${randomBytes(20).toString('hex')}`;
          const expiresAt = new Date(Date.now() + 600_000);
          await ctx.context.internalAdapter.createVerificationValue({ identifier, value: issued.user.id, expiresAt });
          await ctx.context.internalAdapter.createVerificationValue({ identifier: `2fa-attempts-${identifier}`, value: '0', expiresAt });
          const cookie = ctx.context.createAuthCookie('two_factor', { maxAge: 600 });
          await ctx.setSignedCookie(cookie.name, identifier, ctx.context.secret, cookie.attributes);
          if (ctx.path === '/passkey/verify-authentication') return ctx.json({ twoFactorRedirect: true });
          const url = new URL(loginPathFor(destination), ctx.context.baseURL);
          url.searchParams.set('mfa', 'required');
          url.searchParams.set('callbackUrl', destination);
          throw ctx.redirect(url.href);
        }

        if (!notifications) return;
        // O plugin TOTP já removeu newSession em um login com fator pendente.
        if (issued && (ctx.path.startsWith('/sign-in/') || isMfaSignIn(ctx.path) ||
          ctx.path === '/two-factor/verify-totp' || ctx.path === '/two-factor/verify-backup-code')) {
          await retryNotifications(issued.user.id);
          await enqueueNotification(issued.user.id, `login/${issued.session.id}`, {
            kind: 'login', name: issued.user.name,
            detail: `Acesso em ${new Date().toISOString()}. Dispositivo: ${(issued.session.userAgent ?? 'não informado').slice(0, 180)}. IP: ${issued.session.ipAddress ?? 'não informado'}.`,
          });
        }
        const securityEvents: Record<string, string> = {
          '/change-password': 'A senha da sua conta foi alterada.',
          '/two-factor/disable': 'A autenticação em duas etapas foi desativada.',
          '/passkey/verify-registration': 'Uma nova chave de acesso foi cadastrada.',
          '/passkey/delete-passkey': 'Uma chave de acesso foi removida.',
          '/two-factor/generate-backup-codes': 'Novos códigos de recuperação foram gerados.',
        };
        const result = ctx.context.returned;
        const succeeded = result && !(result instanceof Error) && !(result instanceof Response && !result.ok);
        const current = issued ?? ctx.context.session;
        if (succeeded && current && securityEvents[ctx.path]) {
          await enqueueNotification(current.user.id, `security/${randomBytes(16).toString('hex')}`, {
            kind: 'security', name: current.user.name, detail: securityEvents[ctx.path],
          });
        }
        if (succeeded && current && ctx.path === '/two-factor/verify-totp' && issued) {
          await enqueueNotification(current.user.id, `mfa/${issued.session.id}`, {
            kind: 'security', name: current.user.name, detail: 'Uma verificação pelo aplicativo autenticador foi concluída.',
          });
        }
      }),
    }] },
  };
}
