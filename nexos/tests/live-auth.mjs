// Explicit integration test: creates two disposable Auth users, sends no emails,
// runs an isolated local app, and revokes/deletes its fixtures in finally.
import assert from 'node:assert/strict';
import { createHash, createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import env from '@next/env';
import { createAdminClient } from '@supabase/server/core';
import { request } from '@playwright/test';

env.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
assert.ok(url && secret, 'Supabase server configuration required');
const admin = createAdminClient({ env: { url, secretKeys: { default: secret } } });
const run = randomUUID();
const replayKey = randomUUID();
const replayKeyHash = createHash('sha256').update(replayKey).digest('hex');
const checkoutSecret = randomUUID() + randomUUID();
const password = `${randomUUID()}-Aa9!`;
const origin = 'http://localhost:3200';
const fixtures = [];
const contexts = [];
let server;

function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bits = [...secret.replace(/=+$/, '').toUpperCase()].map(c => alphabet.indexOf(c).toString(2).padStart(5, '0')).join('');
  const key = Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', key).update(counter).digest();
  const offset = hash[19] & 15;
  return ((hash.readUInt32BE(offset) & 0x7fffffff) % 1000000).toString().padStart(6, '0');
}

async function post(client, action, data = {}) {
  return client.post(`/api/auth/${action}`, { data });
}

async function completeMfa(client, prefix) {
  const before = await client.get(prefix ? '/conta' : '/dashboard', { maxRedirects: 0 });
  assert.equal(before.status(), 307, 'AAL1 must not render protected pages');
  const enrolled = await post(client, `${prefix}enroll`);
  assert.equal(enrolled.status(), 200, 'MFA enrollment must succeed');
  const factor = await enrolled.json();
  assert.ok(factor.secret && factor.qr && factor.factorId, 'Enrollment must return a QR code and factor');
  const invalidCode = ((Number(totp(factor.secret)) + 1) % 1000000).toString().padStart(6, '0');
  const invalid = await post(client, `${prefix}verify`, { factorId: factor.factorId, code: invalidCode });
  assert.equal(invalid.status(), 400, 'Wrong MFA code must be rejected');
  const verified = await post(client, `${prefix}verify`, { factorId: factor.factorId, code: totp(factor.secret) });
  assert.equal(verified.status(), 200, 'Valid MFA code must succeed');
  assert.equal((await verified.json()).ok, true);
}

try {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(3200, () => probe.close(resolve));
  });
  for (const role of ['customer', 'admin']) {
    const email = `nexos-test-${role}-${run}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: role === 'admin', user_metadata: { role: 'admin', integration_test: run } });
    assert.equal(error, null, 'Disposable test user creation failed');
    fixtures.push({ id: data.user.id, email });
  }
  server = spawn(process.execPath, ['--use-system-ca', 'node_modules/next/dist/bin/next', 'start', '-p', '3200'], {
    env: { ...process.env, SITE_URL: origin, DASHBOARD_ADMIN_USER_IDS: fixtures[1].id, TURNSTILE_ENFORCED: 'false', NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-runtime-public-key', TURNSTILE_SECRET_KEY: 'test-runtime-private-key', ASAAS_ENV: 'sandbox', ASAAS_API_KEY: 'invalid-test-key-no-payments', CHECKOUT_STATUS_SECRET: checkoutSecret },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  server.on('error', error => { throw error; });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {       ready = (await fetch(`${origin}/admin-dashboard-su/secure-entry`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Isolated test server failed to start');
  for (let i = 0; i < 2; i++) contexts.push(await request.newContext({ baseURL: origin, extraHTTPHeaders: { Origin: origin, 'x-forwarded-for': `${run}-${i}` } }));
  const [customer, operator] = contexts;
  const securityConfig = await customer.get('/api/security/config');
  assert.equal(securityConfig.status(), 200);
  assert.deepEqual(await securityConfig.json(), { required: false, configured: true, siteKey: 'test-runtime-public-key' }, 'Captcha config must use runtime env and expose only the public key');
  assert.ok(securityConfig.headers()['cache-control'].includes('no-store'));
  const denied = await post(customer, 'user-login', { email: fixtures[0].email, password });
  assert.equal(denied.status(), 401, 'Unconfirmed email must be rejected');
  const confirmed = await admin.auth.admin.updateUserById(fixtures[0].id, { email_confirm: true });
  assert.equal(confirmed.error, null);
  const login = await post(customer, 'user-login', { email: fixtures[0].email, password });
  assert.equal(login.status(), 200);
  assert.equal((await login.json()).enrollmentRequired, true);
  assert.equal((await customer.get('/api/auth/session')).status(), 403, 'Session preflight must require MFA');
  await completeMfa(customer, 'user-');
  const session = await customer.get('/api/auth/session');
  assert.equal(session.status(), 200);
  assert.deepEqual(await session.json(), { ok: true, email: fixtures[0].email });
  assert.ok(session.headers()['cache-control'].includes('no-store'));
  assert.equal((await customer.get('/conta')).status(), 200);
  assert.equal((await customer.get('/api/supabase/health')).status(), 403, 'User-editable admin metadata must not authorize admin access');
  const state = await customer.storageState();
  const authCookies = state.cookies.filter(cookie => cookie.name.includes('auth-token'));
  assert.ok(authCookies.length > 0);
  assert.ok(authCookies.every(cookie => cookie.httpOnly && cookie.secure && cookie.sameSite === 'Lax'));
  const forged = await request.newContext({ baseURL: origin, storageState: { ...state, cookies: state.cookies.map(cookie => cookie.name.includes('auth-token') ? { ...cookie, value: 'forged' } : cookie) } });
  contexts.push(forged);
  assert.equal((await forged.get('/conta', { maxRedirects: 0 })).status(), 307, 'Forged cookie must not authorize');
  const adminLogin = await post(operator, 'login', { email: fixtures[1].email, password });
  assert.equal(adminLogin.status(), 200);
  assert.equal((await operator.get('/api/supabase/health')).status(), 403, 'Admin AAL1 must be rejected');
  await completeMfa(operator, '');
  assert.equal((await operator.get('/api/supabase/health')).status(), 200);
  const dashboard = await operator.get('/dashboard');
  assert.equal(dashboard.status(), 200);
  assert.ok((await dashboard.text()).includes(fixtures[1].email));

  // Seed a completed synthetic attempt: replay never contacts the payment provider.
  const purchase = { productId: 'placa', name: 'Integration Test', email: fixtures[0].email, cpfCnpj: '12345678901', billingType: 'CREDIT_CARD', installments: 1, quantity: 1 };
  const payloadHash = createHmac('sha256', checkoutSecret).update(JSON.stringify({ productId: purchase.productId, name: purchase.name, email: purchase.email, cpfDigits: purchase.cpfCnpj, billingType: purchase.billingType, installments: purchase.installments, quantity: purchase.quantity })).digest('hex');
  const replayResult = { paymentId: `synthetic-${run}`, statusToken: 'synthetic-private-token' };
  const seeded = await admin.from('idempotency_keys').insert({ owner_id: fixtures[0].id, key_hash: replayKeyHash, payload_hash: payloadHash, status: 'succeeded', result: replayResult });
  assert.equal(seeded.error, null, 'Synthetic replay fixture must be created');
  const ownReplay = await customer.post('/api/checkout', { headers: { 'Idempotency-Key': replayKey }, data: purchase });
  assert.equal(ownReplay.status(), 200);
  assert.deepEqual(await ownReplay.json(), replayResult);
  const foreignReplay = await operator.post('/api/checkout', { headers: { 'Idempotency-Key': replayKey }, data: purchase });
  assert.equal(foreignReplay.status(), 409, 'A different authenticated account cannot recover another user’s payment');
  assert.equal((await foreignReplay.text()).includes('synthetic-private-token'), false);
  assert.equal((await post(customer, 'user-logout')).status(), 200);
  assert.equal((await customer.get('/api/auth/session')).status(), 401);
  assert.equal((await customer.get('/conta', { maxRedirects: 0 })).status(), 307);
  console.log('PASS: email confirmation, real TOTP, session preflight, AAL1 denial, AAL2 access, admin allowlist, forged cookies, HttpOnly/Secure cookies, payment replay ownership and logout.');
} finally {
  for (const context of contexts) {
    await post(context, 'logout').catch(() => {});
    await context.dispose();
  }
  if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
  let cleanupFailed = false;
  const replayCleanup = await admin.from('idempotency_keys').delete().eq('key_hash', replayKeyHash);
  if (replayCleanup.error) { cleanupFailed = true; console.error('Could not clean up synthetic payment replay fixture.'); }
  for (const fixture of fixtures) {
    const { error } = await admin.auth.admin.deleteUser(fixture.id);
    if (error) { cleanupFailed = true; console.error(`Cleanup required for test Auth user ${fixture.id}`); }
  }
  const rateKeys = fixtures.flatMap((fixture, i) => [
    `auth:mfa:${fixture.id}`, `auth:account:login:${fixture.email}`,
    ...['login', 'enroll', 'verify', 'factor'].map(action => `auth:${action}:${run}-${i}`),
  ]).map(key => createHmac('sha256', secret).update(key).digest('hex'));
  if (rateKeys.length) {
    const { error } = await admin.from('auth_rate_limits').delete().in('key_hash', rateKeys);
    if (error) { cleanupFailed = true; console.error('Could not clean up test rate-limit entries.'); }
  }
  assert.equal(cleanupFailed, false, 'Test fixture cleanup failed');
  console.log('Disposable Auth fixtures removed.');
}
