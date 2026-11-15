import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { NextRequest } from 'next/server';
import { createEntryToken, readEntryToken, entryReturnPath, entryCookies, ENTRY_TTL, ENTRY_ACTION } from '../src/lib/site-entry.ts';
import { proxy } from '../src/proxy.ts';
import { GET } from '../src/app/verificar/route.ts';
import { POST } from '../src/app/api/security/entry/route.ts';

const site = 'https://nexoslab.online';
const userAgent = 'Entry security test';
const keys = ['SITE_ENTRY_ENFORCED', 'SITE_URL', 'BETTER_AUTH_SECRET', 'TURNSTILE_SECRET_KEY', 'NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'DATABASE_URL'];
let original;
beforeEach(() => {
  original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, { SITE_ENTRY_ENFORCED: 'true', SITE_URL: site, BETTER_AUTH_SECRET: 'test-only-entry-signing-secret-32-characters', TURNSTILE_SECRET_KEY: 'test-only-turnstile-secret', NEXT_PUBLIC_TURNSTILE_SITE_KEY: '1x00000000000000000000AA', DATABASE_URL: 'postgresql://test:test@localhost/test' });
});
afterEach(() => { for (const key of keys) { if (original[key] === undefined) delete process.env[key]; else process.env[key] = original[key]; } });

function request(path = '/', options = {}) {
  return new NextRequest(`${site}${path}`, { ...options, headers: { 'user-agent': userAgent, ...options.headers } });
}
function post(token, challenge, options = {}) {
  return request('/api/security/entry', { method: 'POST', body: JSON.stringify({ token, next: '/placa-nfc?from=entry' }), ...options,
    headers: { Origin: site, 'Content-Type': 'application/json', Cookie: `${entryCookies(site).challenge}=${challenge}`, ...options.headers } });
}

test('clearance is signed, expires, is bound to the browser and cannot substitute a challenge', () => {
  const now = Date.now();
  const { token } = createEntryToken('clearance', userAgent, now);
  assert.ok(readEntryToken(token, 'clearance', userAgent, now));
  assert.equal(readEntryToken(token, 'challenge', userAgent, now), null);
  assert.equal(readEntryToken(token, 'clearance', 'Different browser', now), null);
  assert.equal(readEntryToken(token, 'clearance', userAgent, now + ENTRY_TTL * 1000), null);
  const [payload, signature] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), expires: 9999999999 })).toString('base64url');
  assert.equal(readEntryToken(`${forged}.${signature}`, 'clearance', userAgent, now), null);
  assert.equal(readEntryToken('x'.repeat(2048), 'clearance', userAgent), null);
  process.env.BETTER_AUTH_SECRET = 'a-different-test-only-signing-secret-32-characters';
  assert.equal(readEntryToken(token, 'clearance', userAgent, now), null);
});

test('return destinations cannot redirect externally or recurse through the challenge', () => {
  for (const path of ['https://attacker.test', '//attacker.test', '/\\attacker.test', '/%2f%2fattacker.test', '/verificar', '/api/security/entry', '/_next/static/x', '/%76erificar', '/a/../verificar', '/\n/attacker.test']) assert.equal(entryReturnPath(path), '/');
  assert.equal(entryReturnPath('/portal/acesso?callbackUrl=%2Fconta'), '/portal/acesso?callbackUrl=%2Fconta');
  assert.equal(entryReturnPath('/placa-nfc?campaign=one#details'), '/placa-nfc?campaign=one#details');
});

test('fresh visits, RSC/prefetch, forged cookies and private routes cannot receive page content', async () => {
  for (const path of ['/', '/placa-nfc?from=one', '/portal/acesso', '/conta']) {
    for (const headers of [{}, { RSC: '1', 'Next-Router-Prefetch': '1', Accept: 'text/x-component' }, { Cookie: '__Host-ezway-clearance=forged' }]) {
      const response = await proxy(request(path, { headers }));
      assert.equal(response.status, 303, path);
      assert.equal(new URL(response.headers.get('location')).pathname, '/verificar');
      assert.equal(new URL(response.headers.get('location')).searchParams.get('next'), path);
      assert.match(response.headers.get('cache-control'), /no-store/);
    }
  }
  const { token } = createEntryToken('clearance', userAgent);
  const response = await proxy(request('/', { headers: { Cookie: `__Host-ezway-clearance=${token}` } }));
  assert.equal(response.headers.get('x-middleware-next'), '1');
  const session = await proxy(request('/conta', { headers: { Cookie: `__Host-ezway-clearance=${token}` } }));
  assert.equal(new URL(session.headers.get('location')).pathname, '/portal/acesso');
});

test('challenge document has only the security screen, a signed HttpOnly challenge and a CSP nonce', async () => {
  const response = GET(request('/verificar?next=%2Fplaca-nfc', { headers: { 'x-nonce': 'test-csp-nonce' } }));
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /Verificação de segurança/);
  assert.match(html, /nonce="test-csp-nonce"/);
  assert.match(html, /challenges.cloudflare.com/);
  assert.doesNotMatch(html, /hero-title|gloved-hand|\/_next\/|Seu negócio/);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /Secure/i);
  assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
});

test('verification requires same origin and a valid challenge before contacting Cloudflare', async t => {
  t.mock.method(globalThis, 'fetch', () => { throw new Error('Cloudflare should not be called'); });
  assert.equal((await POST(post('anything', 'invalid'))).status, 403);
  const { token } = createEntryToken('challenge', userAgent);
  assert.equal((await POST(post('anything', token, { headers: { Origin: 'https://attacker.test' } }))).status, 403);
  assert.equal((await POST(post('', token))).status, 400);
  assert.equal((await POST(post('x'.repeat(9000), token))).status, 413);
});

test('only verified hostname, action and browser challenge can mint clearance; failures stay closed', async t => {
  const challenge = createEntryToken('challenge', userAgent);
  t.mock.method(pg.Pool.prototype, 'query', async () => ({ rows: [{ count: 1, lastRequest: String(Date.now()) }] }));
  let result = { success: true, hostname: 'nexoslab.online', action: ENTRY_ACTION, cdata: challenge.claims.nonce };
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(options.body.get('response'), 'cloudflare-test-token');
    return Response.json(result);
  });
  for (const patch of [{ success: false }, { hostname: 'attacker.test' }, { action: 'contact' }, { cdata: 'another-browser-challenge' }]) {
    const previous = result;
    result = { ...result, ...patch };
    const response = await POST(post('cloudflare-test-token', challenge.token));
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('set-cookie'), null);
    result = previous;
  }
  const response = await POST(post('cloudflare-test-token', challenge.token));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { redirectTo: '/placa-nfc?from=entry' });
  const cookie = response.cookies.get('__Host-ezway-clearance');
  assert.ok(readEntryToken(cookie.value, 'clearance', userAgent));
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(response.headers.get('set-cookie'), /SameSite=lax/i);
});

test('rate limits, missing configuration and upstream outages never issue clearance', async t => {
  const challenge = createEntryToken('challenge', userAgent);
  const query = t.mock.method(pg.Pool.prototype, 'query', async () => ({ rows: [{ count: 31, lastRequest: String(Date.now()) }] }));
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('Network unavailable'); });
  assert.equal((await POST(post('cloudflare-test-token', challenge.token))).status, 429);
  query.mock.mockImplementation(async () => ({ rows: [{ count: 1, lastRequest: String(Date.now()) }] }));
  const outage = await POST(post('cloudflare-test-token', challenge.token));
  assert.equal(outage.status, 503);
  assert.equal(outage.headers.get('set-cookie'), null);
  delete process.env.TURNSTILE_SECRET_KEY;
  assert.equal((await POST(post('cloudflare-test-token', challenge.token))).status, 503);
  assert.equal(GET(request('/verificar')).status, 503);
});

test('o origin direto e recusado, mas preview (outro host) continua permitido', async () => {
  // esta checagem so vale em producao
  const previousNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
  // com cf-ray a checagem de origin passa; como nao ha clearance, cai no gate (303)
  const withCloudflare = await proxy(request('/', { headers: { 'cf-ray': 'a1b2c3d4e5f6' } }));
  assert.equal(withCloudflare.status, 303, 'com cf-ray (via Cloudflare) deve passar pela checagem de origin');
  assert.equal(new URL(withCloudflare.headers.get('location')).pathname, '/verificar');

  const direct = await proxy(request('/', { headers: {} }));
  assert.equal(direct.status, 403, 'sem cf-ray (origin direto) deve ser recusado');
  assert.equal(new URL(direct.headers.get('location') ?? 'http://x/').pathname, '/');

  // preview: host diferente do canônico -> permitido mesmo sem cf-ray
  const preview = await proxy(new NextRequest('https://nexos-git-branch.vercel.app/', {
    headers: { 'user-agent': userAgent },
  }));
  assert.equal(preview.status, 303, 'preview deve cair no gate, e nao em 403 de origin');
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previousNodeEnv;
  }
});
