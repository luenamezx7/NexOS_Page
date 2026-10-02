import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { chromium } from '@playwright/test';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import pg from 'pg';
import nextEnv from '@next/env';
import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import { createAuth } from '../src/lib/auth/instance.ts';

nextEnv.loadEnvConfig(process.cwd());
const schema = `nexos_auth_test_${randomBytes(8).toString('hex')}`;
const SITE = 'http://localhost:3199';
const PASSWORD = 'Test-Password-12345!';
const messages = [];
const dbOptions = { connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 };
let admin, pool, auth, authOptions, accountId, ip = 10;

class Jar {
  values = new Map();
  receive(response) {
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(';')[0]; const equals = pair.indexOf('=');
      const name = pair.slice(0, equals), value = pair.slice(equals + 1);
      if (/max-age=0/i.test(line)) this.values.delete(name); else this.values.set(name, value);
    }
  }
  header() { return [...this.values].map(([key, value]) => `${key}=${value}`).join('; '); }
}
async function request(path, body, jar = new Jar(), options = {}) {
  const response = await (options.auth ?? auth).handler(new Request(`${SITE}/api/auth${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { Origin: SITE, 'Content-Type': 'application/json', 'User-Agent': 'NexOS Integration',
      'x-forwarded-for': options.ip ?? `192.0.2.${++ip}`, Cookie: jar.header(), ...options.headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  jar.receive(response);
  return response;
}
async function login(jar = new Jar(), email = 'customer@example.test', password = PASSWORD) {
  const response = await request('/sign-in/email', { email, password }, jar);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  return jar;
}
function lastMail(kind) { return messages.filter(mail => mail.kind === kind).at(-1); }

before(async () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL necessária: testes usam schema temporário isolado e removido ao final');
  admin = new pg.Pool(dbOptions);
  await admin.query(`create schema "${schema}"`);
  pool = new pg.Pool({ ...dbOptions, max: 3, options: `-c search_path=${schema}` });
  for (const file of ['supabase/migrations/20260930120000_better_auth.sql']) {
    await pool.query(readFileSync(file, 'utf8').replaceAll('public.', `"${schema}".`));
  }
  await pool.query(`create table "${schema}".welcome_email_log (user_id uuid references "${schema}"."user"(id), template text, sent_at timestamptz default now())`);
  await pool.query(readFileSync('supabase/migrations/20261001152936_auth_methods_and_email_outbox.sql', 'utf8').replaceAll('public.', `"${schema}".`));
  const capture = kind => async params => { messages.push({ kind, ...params }); };
  authOptions = { pool, siteURL: SITE, secret: randomBytes(48).toString('hex'), captchaEnabled: false, notifications: false,
    socialProviders: {
      github: { clientId: 'integration-github-id', clientSecret: 'integration-github-secret' },
      google: { clientId: 'integration-google-id', clientSecret: 'integration-google-secret', prompt: 'select_account' },
    },
    mail: { verification: capture('verification'), reset: capture('reset'), magic: capture('magic') } };
  auth = createAuth(authOptions);
});
after(async () => {
  await pool?.end();
  if (admin) { await admin.query(`drop schema if exists "${schema}" cascade`); await admin.end(); }
});

test('cadastro, confirmação, senha forte e cookies HTTP-only', async () => {
  const weak = await request('/sign-up/email', { email: 'weak@example.test', password: 'aaaaaaaaaaaa', name: 'Weak' });
  assert.equal(weak.status, 400);
  const signup = await request('/sign-up/email', { email: 'customer@example.test', password: PASSWORD, name: 'Cliente', callbackURL: '/portal/acesso' });
  assert.equal(signup.status, 200, JSON.stringify(await signup.clone().json()));
  accountId = (await signup.json()).user.id;
  const before = await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD });
  assert.equal(before.status, 403);
  const link = new URL(lastMail('verification').url);
  assert.equal((await request(`${link.pathname.replace('/api/auth', '')}${link.search}`)).status, 302);
  const jar = new Jar();
  const response = await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD }, jar);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /SameSite=Lax/i);
  assert.equal((await (await request('/get-session', undefined, jar)).json()).user.email, 'customer@example.test');
  assert.equal((await request('/sign-in/email', { email: 'customer@example.test', password: 'Wrong-Password-12345!' })).status, 401);
  await request('/sign-out', {}, jar);
  assert.equal(await (await request('/get-session', undefined, jar)).json(), null);
});

test('redefinição envia token, recusa expiração/reutilização e revoga sessões', async () => {
  const jar = await login();
  const valid = await request('/request-password-reset', { email: 'customer@example.test', redirectTo: `${SITE}/portal/redefinir` });
  const missing = await request('/request-password-reset', { email: 'missing@example.test', redirectTo: `${SITE}/portal/redefinir` });
  assert.deepEqual(await valid.json(), await missing.json());
  const reset = new URL(lastMail('reset').url);
  const token = reset.pathname.split('/').at(-1);
  assert.equal((await request('/reset-password', { token: 'expired-token', newPassword: PASSWORD })).status, 400);
  await pool.query('insert into verification (identifier, value, "expiresAt", "createdAt", "updatedAt") values ($1,$2,$3,$4,$4)', ['reset-password:expired-test', accountId, new Date(Date.now() - 1000), new Date()]);
  assert.equal((await request('/reset-password', { token: 'expired-test', newPassword: PASSWORD })).status, 400);
  assert.equal((await request('/reset-password', { token, newPassword: PASSWORD })).status, 200);
  assert.equal((await request('/reset-password', { token, newPassword: PASSWORD })).status, 400);
  assert.equal(await (await request('/get-session', undefined, jar)).json(), null);
});

test('troca exige senha atual e aplica política forte no servidor', async () => {
  const jar = await login();
  assert.equal((await request('/change-password', { currentPassword: 'Wrong-12345!', newPassword: PASSWORD }, jar)).status, 400);
  assert.equal((await request('/change-password', { currentPassword: PASSWORD, newPassword: 'aaaaaaaaaaaa' }, jar)).status, 400);
  assert.equal((await request('/change-password', { currentPassword: PASSWORD, newPassword: PASSWORD, revokeOtherSessions: true }, jar)).status, 200);
});

test('Magic Link tem hash no banco, uso único e rejeita destino externo', async () => {
  assert.equal((await request('/sign-in/magic-link', { email: 'customer@example.test', callbackURL: '/conta', errorCallbackURL: '/portal/acesso?confirmation=error' })).status, 200);
  const url = new URL(lastMail('magic').url);
  const token = url.searchParams.get('token');
  const rows = await pool.query('select identifier from verification where identifier like $1', ['magic-link:%']);
  assert.ok(rows.rows.length > 0);
  assert.ok(rows.rows.every(row => !row.identifier.includes(token)));
  const jar = new Jar();
  const path = `${url.pathname.replace('/api/auth', '')}${url.search}`;
  assert.equal((await request(path, undefined, jar)).status, 302);
  assert.ok((await (await request('/get-session', undefined, jar)).json()).session);
  assert.match((await request(path)).headers.get('location'), /INVALID_TOKEN/);
  const unsafe = await request('/sign-in/magic-link', { email: 'customer@example.test', callbackURL: 'https://attacker.example' });
  assert.equal(unsafe.status, 403);
});

test('TOTP exige senha, confirma enrollment, bloqueia sessão e consome backup uma vez', async () => {
  const jar = await login();
  assert.equal((await request('/two-factor/enable', { method: 'totp' }, jar)).status, 400);
  const response = await request('/two-factor/enable', { method: 'totp', password: PASSWORD }, jar);
  assert.equal(response.status, 200, JSON.stringify(await response.clone().json()));
  const setup = await response.json();
  assert.match(setup.totpURI, /^otpauth:\/\/totp\//);
  const secret = new TextDecoder().decode(base32.decode(new URL(setup.totpURI).searchParams.get('secret')));
  const otp = await createOTP(secret).totp();
  assert.equal((await request('/two-factor/verify-totp', { code: otp }, jar)).status, 200);
  await request('/sign-out', {}, jar);
  const challenged = await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD }, jar);
  assert.equal((await challenged.json()).twoFactorRedirect, true);
  assert.equal(await (await request('/get-session', undefined, jar)).json(), null);
  assert.equal((await request('/two-factor/verify-totp', { code: 'wrong' }, jar)).status, 401);
  assert.equal((await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, jar)).status, 200);
  await request('/sign-out', {}, jar);
  await login(jar);
  assert.equal((await request('/two-factor/verify-backup-code', { code: setup.backupCodes[0] }, jar)).status, 200);
  await request('/sign-out', {}, jar);
  await login(jar);
  assert.equal((await request('/two-factor/verify-backup-code', { code: setup.backupCodes[0] }, jar)).status, 401);
  assert.equal((await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, jar)).status, 200);
  // Magic Link também deve apagar a sessão antes do segundo fator.
  await request('/sign-in/magic-link', { email: 'customer@example.test', callbackURL: '/conta' });
  const magic = new URL(lastMail('magic').url), other = new Jar();
  const callback = await request(`${magic.pathname.replace('/api/auth', '')}${magic.search}`, undefined, other);
  assert.match(callback.headers.get('location'), /mfa=required/);
  assert.equal(await (await request('/get-session', undefined, other)).json(), null);
  assert.equal((await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, other)).status, 200);
  assert.equal((await request('/two-factor/disable', { password: PASSWORD }, jar)).status, 200);
});

test('CSRF e rate limit persistido recusam abuso', async () => {
  assert.equal((await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD }, undefined, { headers: { Origin: 'https://attacker.example' } })).status, 403);
  let status;
  for (let i = 0; i < 11; i++) status = (await request('/sign-in/email', { email: 'missing@example.test', password: PASSWORD }, undefined, { ip: '198.51.100.10' })).status;
  assert.equal(status, 429);
});

test('Passkey lista exige sessão e registro exige verificação do dispositivo', async () => {
  assert.equal((await request('/passkey/list-user-passkeys')).status, 401);
  const jar = await login();
  const result = await request('/passkey/generate-register-options', undefined, jar);
  assert.equal(result.status, 200);
  const options = await result.json();
  assert.equal(options.authenticatorSelection.userVerification, 'required');
  assert.equal(options.authenticatorSelection.residentKey, 'required');
  assert.equal(options.rp.id, 'localhost');
  assert.equal((await request('/passkey/verify-registration', { response: {} }, jar)).status, 400);
});

test('OAuth GitHub simulado mantém callback, exige MFA e trata consentimento cancelado', async t => {
  const jar = await login();
  const setupResponse = await request('/two-factor/enable', { method: 'totp', password: PASSWORD }, jar);
  const setup = await setupResponse.json();
  const secret = new TextDecoder().decode(base32.decode(new URL(setup.totpURI).searchParams.get('secret')));
  await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, jar);
  t.mock.method(globalThis, 'fetch', async input => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('github.com/login/oauth/access_token')) return Response.json({ access_token: 'test-only-token', token_type: 'bearer', scope: 'user:email' });
    if (url.includes('api.github.com/user/emails')) return Response.json([{ email: 'customer@example.test', verified: true, primary: true }]);
    if (url.includes('api.github.com/user')) return Response.json({ id: 998877, login: 'nexos-test', name: 'Cliente', email: 'customer@example.test', avatar_url: null });
    throw new Error('Unexpected external request in isolated OAuth test');
  });
  const oauthJar = new Jar();
  const started = await request('/sign-in/social', { provider: 'github', callbackURL: '/dashboard', errorCallbackURL: '/portal/acesso?confirmation=error&callbackUrl=%2Fdashboard' }, oauthJar);
  const state = new URL((await started.json()).url).searchParams.get('state');
  const callback = await request(`/callback/github?code=test-only-code&state=${encodeURIComponent(state)}`, undefined, oauthJar);
  assert.match(callback.headers.get('location'), /mfa=required/);
  assert.match(callback.headers.get('location'), /callbackUrl=%2Fdashboard/);
  assert.equal(await (await request('/get-session', undefined, oauthJar)).json(), null);
  assert.equal((await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, oauthJar)).status, 200);
  const cancelledJar = new Jar();
  const startCancelled = await request('/sign-in/social', { provider: 'github', callbackURL: '/conta', errorCallbackURL: '/portal/acesso?confirmation=error&callbackUrl=%2Fconta' }, cancelledJar);
  const cancelledState = new URL((await startCancelled.json()).url).searchParams.get('state');
  const cancelled = await request(`/callback/github?error=access_denied&state=${encodeURIComponent(cancelledState)}`, undefined, cancelledJar);
  assert.match(cancelled.headers.get('location'), /confirmation=error/);
  assert.match(cancelled.headers.get('location'), /callbackUrl=%2Fconta/);
  await request('/two-factor/disable', { password: PASSWORD }, jar);
});

test('CAPTCHA exige header e indisponibilidade de configuração falha fechada', async t => {
  const previous = process.env.TURNSTILE_SECRET_KEY;
  try {
    delete process.env.TURNSTILE_SECRET_KEY;
    const closed = createAuth({ ...authOptions, captchaEnabled: true });
    assert.equal((await request('/request-password-reset', { email: 'customer@example.test' }, undefined, { auth: closed })).status, 503);
    process.env.TURNSTILE_SECRET_KEY = 'test-only-turnstile-secret';
    const guarded = createAuth({ ...authOptions, captchaEnabled: true });
    t.mock.method(globalThis, 'fetch', async () => Response.json({ success: true }));
    assert.equal((await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD, captchaToken: 'body-is-not-valid' }, undefined, { auth: guarded })).status, 400);
    assert.equal((await request('/sign-in/email', { email: 'customer@example.test', password: PASSWORD }, undefined, { auth: guarded, headers: { 'x-captcha-response': 'test-valid-token' } })).status, 200);
  } finally {
    if (previous === undefined) delete process.env.TURNSTILE_SECRET_KEY; else process.env.TURNSTILE_SECRET_KEY = previous;
  }
});

test('WebAuthn real no Chromium cadastra, autentica, exige TOTP e recusa replay', { timeout: 90000 }, async () => {
  // Autenticador virtual executa a cerimônia criptográfica real; o DB continua isolado.
  const server = createServer(async (req, res) => {
    try {
      if (!req.url.startsWith('/api/auth/')) {
        res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><title>WebAuthn integration</title>'); return;
      }
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const response = await auth.handler(new Request(`${SITE}${req.url}`, {
        method: req.method, headers: { ...req.headers, 'x-forwarded-for': `192.0.2.${++ip}` },
        ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {}),
      }));
      res.statusCode = response.status;
      response.headers.forEach((value, key) => { if (key !== 'set-cookie') res.setHeader(key, value); });
      res.setHeader('Set-Cookie', response.headers.getSetCookie());
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.statusCode = 500; res.end('Isolated test server error'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(3199, resolve); });
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    await cdp.send('WebAuthn.addVirtualAuthenticator', { options: {
      protocol: 'ctap2', transport: 'internal', hasResidentKey: true,
      hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true,
    } });
    await page.goto(SITE);
    const api = (path, body) => page.evaluate(async ({ path, body }) => {
      const result = await fetch(`/api/auth${path}`, { method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      return { status: result.status, data: await result.json() };
    }, { path, body });
    assert.equal((await api('/sign-in/email', { email: 'customer@example.test', password: PASSWORD })).status, 200);
    const options = await api('/passkey/generate-register-options');
    assert.equal(options.status, 200);
    const credential = await page.evaluate(async options => {
      const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
      const key = await navigator.credentials.create({ publicKey: { ...options,
        challenge: decode(options.challenge), user: { ...options.user, id: decode(options.user.id) },
        excludeCredentials: options.excludeCredentials?.map(c => ({ ...c, id: decode(c.id) })),
      } });
      return key.toJSON();
    }, options.data);
    const registered = await api('/passkey/verify-registration', { response: credential, name: 'Chromium virtual' });
    assert.equal(registered.status, 200, JSON.stringify(registered.data));
    const savedId = registered.data.id;
    assert.equal((await api('/passkey/list-user-passkeys')).data.length, 1);
    await api('/sign-out', {});
    const signIn = async () => {
      const options = await api('/passkey/generate-authenticate-options');
      assert.equal(options.status, 200);
      const assertion = await page.evaluate(async options => {
        const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const key = await navigator.credentials.get({ publicKey: { ...options,
          challenge: decode(options.challenge), allowCredentials: options.allowCredentials?.map(c => ({ ...c, id: decode(c.id) })),
        } });
        return key.toJSON();
      }, options.data);
      return { result: await api('/passkey/verify-authentication', { response: assertion }), assertion };
    };
    const signedIn = await signIn();
    assert.equal(signedIn.result.status, 200, JSON.stringify(signedIn.result.data));
    assert.equal((await api('/get-session')).data.user.id, accountId);
    assert.equal((await api('/passkey/verify-authentication', { response: signedIn.assertion })).status, 400);
    const setup = await api('/two-factor/enable', { method: 'totp', password: PASSWORD });
    assert.equal(setup.status, 200);
    const secret = new TextDecoder().decode(base32.decode(new URL(setup.data.totpURI).searchParams.get('secret')));
    assert.equal((await api('/two-factor/verify-totp', { code: await createOTP(secret).totp() })).status, 200);
    await api('/sign-out', {});
    const challenged = await signIn();
    assert.equal(challenged.result.data.twoFactorRedirect, true);
    assert.equal((await api('/get-session')).data, null);
    assert.equal((await api('/two-factor/verify-totp', { code: await createOTP(secret).totp() })).status, 200);
    assert.equal((await api('/passkey/delete-passkey', { id: savedId })).status, 200);
    assert.equal((await api('/passkey/list-user-passkeys')).data.length, 0);
    assert.equal((await api('/two-factor/disable', { password: PASSWORD })).status, 200);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
});

test('OAuth Google simulado verifica JWT assinado, callback e desafio MFA', async t => {
  const jar = await login();
  const setup = await (await request('/two-factor/enable', { method: 'totp', password: PASSWORD }, jar)).json();
  const secret = new TextDecoder().decode(base32.decode(new URL(setup.totpURI).searchParams.get('secret')));
  await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, jar);
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(publicKey), kid: 'isolated-google-key', alg: 'RS256', use: 'sig' };
  const oauthJar = new Jar();
  const started = await request('/sign-in/social', { provider: 'google', callbackURL: '/conta', errorCallbackURL: '/portal/acesso?confirmation=error' }, oauthJar);
  assert.equal(started.status, 200);
  const authorization = new URL((await started.json()).url);
  assert.equal(authorization.searchParams.get('redirect_uri'), `${SITE}/api/auth/callback/google`);
  assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256');
  const token = await new SignJWT({ email: 'customer@example.test', email_verified: true, name: 'Cliente',
    ...(authorization.searchParams.get('nonce') ? { nonce: authorization.searchParams.get('nonce') } : {}),
  }).setProtectedHeader({ alg: 'RS256', kid: jwk.kid }).setSubject('isolated-google-user')
    .setIssuer('https://accounts.google.com').setAudience('integration-google-id').setIssuedAt().setExpirationTime('5m').sign(privateKey);
  t.mock.method(globalThis, 'fetch', async input => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('oauth2.googleapis.com/token')) return Response.json({ access_token: 'test-only-token', id_token: token, token_type: 'bearer', expires_in: 300 });
    if (url.includes('googleapis.com/oauth2/v3/certs')) return Response.json({ keys: [jwk] });
    throw new Error('Unexpected request in isolated Google test');
  });
  const callback = await request(`/callback/google?code=isolated-code&state=${encodeURIComponent(authorization.searchParams.get('state'))}`, undefined, oauthJar);
  assert.match(callback.headers.get('location'), /mfa=required/);
  assert.equal(await (await request('/get-session', undefined, oauthJar)).json(), null);
  assert.equal((await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, oauthJar)).status, 200);
  assert.equal((await request('/two-factor/disable', { password: PASSWORD }, jar)).status, 200);
});

test('OAuth via Supabase usa PKCE, identidade validada no servidor e MFA Better Auth', async t => {
  const brokerAuth = createAuth({ ...authOptions, supabaseOAuth: { url: 'https://broker.example.test', key: 'public-test-key' } });
  const call = (path, body, jar) => request(path, body, jar, { auth: brokerAuth });
  const current = await login();
  const setup = await (await request('/two-factor/enable', { method: 'totp', password: PASSWORD }, current)).json();
  const secret = new TextDecoder().decode(base32.decode(new URL(setup.totpURI).searchParams.get('secret')));
  await request('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, current);
  let challenge, exchanges = 0, revoked = 0;
  let provider = 'google', email = 'customer@example.test';
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    assert.equal(url.origin, 'https://broker.example.test');
    if (url.pathname.endsWith('/token')) {
      exchanges++;
      const body = JSON.parse(init.body);
      assert.equal(body.auth_code, 'test-broker-code');
      assert.equal(createHash('sha256').update(body.code_verifier).digest('base64url'), challenge);
      return Response.json({ access_token: 'ephemeral-broker-token' });
    }
    if (url.pathname.endsWith('/user')) {
      assert.equal(init.headers.Authorization, 'Bearer ephemeral-broker-token');
      return Response.json({ id: 'broker-user', email, email_confirmed_at: new Date().toISOString(),
        user_metadata: { role: 'admin' }, identities: [{ provider, provider_id: provider === 'google' ? 'isolated-google-user' : 'new-broker-github',
          identity_data: { full_name: 'Cliente OAuth' } }] });
    }
    if (url.pathname.endsWith('/logout')) { revoked++; return new Response(null, { status: 204 }); }
    throw new Error('Unexpected broker request');
  });
  for (const mode of ['existing-google', 'new-github']) {
    provider = mode === 'existing-google' ? 'google' : 'github';
    email = mode === 'existing-google' ? 'customer@example.test' : 'new-broker@example.test';
    const jar = new Jar();
    const start = await call('/sign-in/supabase', { provider, callbackURL: '/conta', errorCallbackURL: '/portal/acesso?confirmation=error' }, jar);
    assert.equal(start.status, 200);
    const url = new URL((await start.json()).url);
    assert.equal(url.origin, 'https://broker.example.test');
    assert.equal(url.searchParams.get('provider'), provider);
    assert.equal(url.searchParams.get('redirect_to'), `${SITE}/api/auth/supabase/callback`);
    assert.equal(url.searchParams.get('code_challenge_method'), 's256');
    challenge = url.searchParams.get('code_challenge');
    const pending = await pool.query('select value from verification order by "createdAt" desc limit 1');
    assert.equal(pending.rows.length, 1);
    assert.ok(!pending.rows[0].value.includes('verifier'));
    const stale = new Jar(); stale.values = new Map(jar.values);
    const callback = await call('/supabase/callback?code=test-broker-code', undefined, jar);
    assert.equal(callback.status, 302);
    if (provider === 'google') {
      assert.match(callback.headers.get('location'), /mfa=required/);
      assert.equal(await (await call('/get-session', undefined, jar)).json(), null);
      assert.equal((await call('/two-factor/verify-totp', { code: await createOTP(secret).totp() }, jar)).status, 200);
    } else assert.equal(callback.headers.get('location'), `${SITE}/conta`);
    const session = await (await call('/get-session', undefined, jar)).json();
    assert.equal(session.user.email, email);
    assert.equal(session.user.role, 'user', 'Metadata do intermediário não concede papel administrativo');
    const replay = await call('/supabase/callback?code=test-broker-code', undefined, stale);
    assert.match(replay.headers.get('location'), /confirmation=error/);
    assert.equal(await (await call('/get-session', undefined, stale)).json(), null);
    await call('/sign-out', {}, jar);
  }
  assert.equal(exchanges, 2); assert.equal(revoked, 2);
  assert.equal((await request('/two-factor/disable', { password: PASSWORD }, current)).status, 200);
});

test('OAuth Supabase recusa cookie ausente, expiração, cancelamento e identidade inválida', async t => {
  const brokerAuth = createAuth({ ...authOptions, supabaseOAuth: { url: 'https://broker.example.test', key: 'public-test-key' } });
  const call = (path, body, jar, headers) => request(path, body, jar, { auth: brokerAuth, headers });
  assert.equal((await call('/sign-in/supabase', { provider: 'google', callbackURL: 'https://attacker.example' })).status, 403);
  assert.equal((await call('/sign-in/supabase', { provider: 'google', errorCallbackURL: 'https://attacker.example' })).status, 403);
  assert.equal((await call('/sign-in/supabase', { provider: 'google' }, undefined, { Origin: 'https://attacker.example' })).status, 403);
  let requests = 0, verified = false, actualProvider = 'google', userStatus = 200;
  t.mock.method(globalThis, 'fetch', async input => {
    requests++;
    const url = new URL(typeof input === 'string' ? input : input.url);
    if (url.pathname.endsWith('/token')) return Response.json({ access_token: 'ephemeral-broker-token' });
    if (url.pathname.endsWith('/user')) return Response.json({ email: 'customer@example.test',
      email_confirmed_at: verified ? new Date().toISOString() : null,
      identities: [{ provider: actualProvider, provider_id: 'isolated-google-user' }] }, { status: userStatus });
    if (url.pathname.endsWith('/logout')) return new Response(null, { status: 204 });
    throw new Error('Unexpected request');
  });
  assert.match((await call('/supabase/callback?code=forged')).headers.get('location'), /confirmation=error/);
  const cancelled = new Jar();
  await call('/sign-in/supabase', { provider: 'google', callbackURL: '/dashboard' }, cancelled);
  const result = await call('/supabase/callback?error=access_denied', undefined, cancelled);
  assert.match(result.headers.get('location'), /callbackUrl=%2Fdashboard/);
  const expired = new Jar();
  await call('/sign-in/supabase', { provider: 'google' }, expired);
  const expiration = await pool.query('update verification set "expiresAt" = $1 where id = (select id from verification order by "createdAt" desc limit 1)', [new Date(Date.now() - 60000)]);
  assert.equal(expiration.rowCount, 1);
  assert.match((await call('/supabase/callback?code=test', undefined, expired)).headers.get('location'), /confirmation=error/);
  assert.equal(requests, 0);
  for (const invalid of ['unverified', 'wrong-provider', 'invalid-server-token']) {
    verified = invalid !== 'unverified'; actualProvider = invalid === 'wrong-provider' ? 'github' : 'google'; userStatus = invalid === 'invalid-server-token' ? 401 : 200;
    const jar = new Jar();
    await call('/sign-in/supabase', { provider: 'google' }, jar);
    assert.match((await call('/supabase/callback?code=test', undefined, jar)).headers.get('location'), /confirmation=error/);
    assert.equal(await (await call('/get-session', undefined, jar)).json(), null);
  }
});
