import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { APIError, createAuthEndpoint } from 'better-auth/api';
import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto';
import { setSessionCookie } from 'better-auth/cookies';
import { handleOAuthUserInfo } from 'better-auth/oauth2';
import { z } from 'zod';
import { sanitizeCallbackPath } from './callback';
import { loginPathFor } from './policy';

export interface SupabaseOAuthOptions { url: string; key: string }

export function supabaseOAuthConfig(): SupabaseOAuthOptions | null {
  if (process.env.SOCIAL_AUTH_USE_SUPABASE !== 'true') return null;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url?.trim() && key?.trim() ? { url: new URL(url).origin, key: key.trim() } : null;
}

const flowSchema = z.object({
  provider: z.enum(['google', 'github']), verifier: z.string().min(43).max(128),
  destination: z.string().max(2048), errorURL: z.string().max(2048),
});

/** Supabase intermedeia apenas OAuth; sessão, autorização e MFA continuam no Better Auth. */
export function supabaseOAuth(options: SupabaseOAuthOptions) {
  const broker = new URL(options.url).origin;
  const brokerFetch = (path: string, init: RequestInit = {}) => fetch(`${broker}/auth/v1${path}`, {
    ...init, headers: { apikey: options.key, 'Content-Type': 'application/json', ...init.headers },
    signal: AbortSignal.timeout(15000), cache: 'no-store', redirect: 'error',
  });
  return {
    id: 'nexos-supabase-oauth',
    endpoints: {
      signInSupabase: createAuthEndpoint('/sign-in/supabase', {
        method: 'POST', body: z.object({ provider: z.enum(['google', 'github']),
          callbackURL: z.string().max(2048).optional(), errorCallbackURL: z.string().max(2048).optional() }),
      }, async ctx => {
        const origin = new URL(ctx.context.baseURL).origin;
        const destination = ctx.body.callbackURL === undefined ? '/conta' : sanitizeCallbackPath(ctx.body.callbackURL);
        if (!destination) throw new APIError('BAD_REQUEST', { message: 'Destino de autenticação inválido.' });
        const errorURL = new URL(ctx.body.errorCallbackURL || loginPathFor(destination), origin);
        if (errorURL.origin !== origin || !['/portal/acesso', '/admin-dashboard-su/secure-entry'].includes(errorURL.pathname)) {
          throw new APIError('BAD_REQUEST', { message: 'Destino de autenticação inválido.' });
        }
        errorURL.searchParams.set('confirmation', 'error');
        errorURL.searchParams.set('callbackUrl', destination);
        const verifier = randomBytes(32).toString('base64url');
        const identifier = `supabase-oauth:${randomBytes(24).toString('hex')}`;
        const oldCookie = ctx.context.createAuthCookie('supabase_oauth', { maxAge: 600 });
        const previous = await ctx.getSignedCookie(oldCookie.name, ctx.context.secret);
        if (typeof previous === 'string' && previous.startsWith('supabase-oauth:')) {
          await ctx.context.internalAdapter.consumeVerificationValue(previous);
        }
        await ctx.context.internalAdapter.createVerificationValue({ identifier,
          value: await symmetricEncrypt({ key: ctx.context.secret, data: JSON.stringify({
            provider: ctx.body.provider, verifier, destination, errorURL: errorURL.href,
          }) }), expiresAt: new Date(Date.now() + 600000),
        });
        await ctx.setSignedCookie(oldCookie.name, identifier, ctx.context.secret, oldCookie.attributes);
        const url = new URL(`${broker}/auth/v1/authorize`);
        url.searchParams.set('provider', ctx.body.provider);
        url.searchParams.set('redirect_to', `${ctx.context.baseURL}/supabase/callback`);
        url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url'));
        url.searchParams.set('code_challenge_method', 's256');
        if (ctx.body.provider === 'google') url.searchParams.set('prompt', 'select_account');
        // O componente navega uma vez; desativa o redirect automático do SDK.
        return ctx.json({ url: url.href, redirect: false });
      }),
      supabaseOAuthCallback: createAuthEndpoint('/supabase/callback', {
        method: 'GET', query: z.object({ code: z.string().max(4096).optional(), error: z.string().max(256).optional(),
          error_code: z.string().max(256).optional(), error_description: z.string().max(2048).optional() }),
      }, async ctx => {
        const origin = new URL(ctx.context.baseURL).origin;
        let errorURL = `${origin}/portal/acesso?confirmation=error`;
        let destination = '/conta';
        let accessToken: string | undefined;
        let result: Awaited<ReturnType<typeof handleOAuthUserInfo>> | undefined;
        const cookie = ctx.context.createAuthCookie('supabase_oauth', { maxAge: 600 });
        const identifier = await ctx.getSignedCookie(cookie.name, ctx.context.secret);
        ctx.setCookie(cookie.name, '', { ...cookie.attributes, maxAge: 0 });
        ctx.setHeader('Referrer-Policy', 'no-referrer');
        try {
          if (typeof identifier !== 'string' || !identifier.startsWith('supabase-oauth:')) throw new Error('INVALID_FLOW');
          const stored = await ctx.context.internalAdapter.consumeVerificationValue(identifier);
          if (!stored || new Date(stored.expiresAt).getTime() <= Date.now()) throw new Error('EXPIRED_FLOW');
          const flow = flowSchema.parse(JSON.parse(await symmetricDecrypt({ key: ctx.context.secret, data: stored.value })));
          errorURL = flow.errorURL; destination = flow.destination;
          if (ctx.query.error || !ctx.query.code) throw new Error('OAUTH_CANCELLED');
          const exchanged = await brokerFetch('/token?grant_type=pkce', {
            method: 'POST', body: JSON.stringify({ auth_code: ctx.query.code, code_verifier: flow.verifier }),
          });
          if (!exchanged.ok) throw new Error('INVALID_CODE');
          const tokens = await exchanged.json();
          if (typeof tokens.access_token !== 'string' || !tokens.access_token) throw new Error('INVALID_TOKEN');
          accessToken = tokens.access_token;
          // A identidade vem de getUser no servidor do Supabase, nunca de metadata enviada pelo cliente.
          const checked = await brokerFetch('/user', { headers: { Authorization: `Bearer ${accessToken}` } });
          if (!checked.ok) throw new Error('INVALID_IDENTITY');
          const user = await checked.json();
          const identity = Array.isArray(user.identities) ? user.identities.find((item: { provider?: unknown }) => item.provider === flow.provider) : null;
          const subject = identity?.provider_id ?? identity?.identity_data?.sub;
          if (!user.email_confirmed_at || typeof user.email !== 'string' || !z.email().safeParse(user.email).success ||
            !identity || !['string', 'number'].includes(typeof subject) || !String(subject).trim()) throw new Error('UNVERIFIED_IDENTITY');
          const profile = identity.identity_data ?? {};
          result = await handleOAuthUserInfo(ctx, {
            userInfo: { id: String(subject), email: user.email, emailVerified: true,
              name: typeof profile.full_name === 'string' ? profile.full_name.slice(0, 120) : typeof profile.name === 'string' ? profile.name.slice(0, 120) : user.email.split('@')[0],
              image: typeof profile.avatar_url === 'string' ? profile.avatar_url : null },
            account: { providerId: flow.provider, accountId: String(subject) },
            callbackURL: destination, disableSignUp: false, requireExactAccountBinding: true,
          });
          if (result.error || !result.data) throw new Error('ACCOUNT_UNAVAILABLE');
        } catch {
          // Não registrar códigos, verificadores, tokens ou resposta de identidade.
          result = undefined;
        } finally {
          // Não manter duas sessões paralelas: o token do intermediário é descartado.
          if (accessToken) {
            try {
              const revoked = await brokerFetch('/logout?scope=local', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } });
              if (!revoked.ok) console.error('[auth/oauth] sessão do intermediário não revogada');
            } catch { console.error('[auth/oauth] revogação do intermediário indisponível'); }
          }
        }
        if (!result?.data) throw ctx.redirect(errorURL);
        await setSessionCookie(ctx, result.data);
        // O hook nexos-security intercepta este redirect e exige TOTP quando ativo.
        throw ctx.redirect(new URL(destination, origin).href);
      }),
    },
  };
}
