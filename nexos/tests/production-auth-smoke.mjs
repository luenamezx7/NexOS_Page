import test from 'node:test';
import assert from 'node:assert/strict';

const site = new URL(process.env.AUTH_SMOKE_URL || 'https://nexoslab.online');
assert.equal(site.protocol, 'https:', 'A homologação remota exige HTTPS.');
const origin = site.origin;
const request = (path, options = {}) => fetch(new URL(path, origin), {
  redirect: 'manual', signal: AbortSignal.timeout(30000), ...options,
});

test('produção: nenhuma página é entregue antes da verificação Turnstile', async () => {
  for (const path of ['/', '/portal/acesso', '/admin-dashboard-su/secure-entry', '/portal/redefinir', '/placa-nfc']) {
    const response = await request(path);
    assert.equal(response.status, 303, path);
    const gate = new URL(response.headers.get('location'), origin);
    assert.equal(gate.pathname, '/verificar');
    assert.equal(gate.searchParams.get('next'), path);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  const gate = await request('/verificar?next=%2F');
  assert.equal(gate.status, 200);
  const html = await gate.text();
  assert.match(html, /Verificação de segurança/);
  assert.match(html, /challenges.cloudflare.com/);
  assert.doesNotMatch(html, /hero-title|gloved-hand|\/_next\//);
  assert.match(gate.headers.get('content-security-policy'), /nonce-/);
  assert.match(gate.headers.get('set-cookie'), /HttpOnly/i);
});

test('produção: cookies forjados não contornam a entrada nem autenticam APIs', async () => {
  for (const path of ['/conta', '/dashboard', '/portal/seguranca']) {
    const response = await request(path);
    assert.equal(response.status, 303);
    assert.equal(new URL(response.headers.get('location'), origin).searchParams.get('next'), path);
  }
  const forged = await request('/conta', { headers: { Cookie: '__Secure-nexos.session_token=forged; __Host-ezway-clearance=forged' } });
  assert.equal(forged.status, 303);
  assert.equal((await request('/api/account/profile')).status, 401);
  assert.equal((await request('/api/auth/session')).status, 401);
  assert.equal(await (await request('/api/auth/get-session')).json(), null);
});

test('produção: um desafio válido com token Cloudflare falso é recusado sem liberar o site', async () => {
  const challenge = await request('/verificar');
  assert.equal(challenge.status, 200);
  const cookie = challenge.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
  assert.ok(cookie.includes('__Host-ezway-entry='));
  const response = await request('/api/security/entry', {
    method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ token: 'invalid-entry-smoke-token', next: '/' }),
  });
  assert.equal(response.status, 403);
  assert.equal(response.headers.get('set-cookie'), null);
});

test('produção: CSRF e job privado recusam requisições não autorizadas', async () => {
  for (const headers of [{ Origin: 'https://attacker.example' }, {}]) {
    const response = await request('/api/auth/sign-in/email', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: '{}',
    });
    assert.equal(response.status, 403);
  }
  assert.equal((await request('/api/internal/email-outbox')).status, 401);
});

test('produção: CAPTCHA está ativo e não aceita login sem desafio', async () => {
  const response = await request('/api/security/config');
  assert.equal(response.status, 200);
  const config = await response.json();
  assert.equal(config.required, true);
  assert.equal(config.configured, true);
  assert.ok(config.siteKey);
  const missing = await request('/api/auth/sign-in/email', { method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'auth-smoke-missing@example.test', password: 'Test-Password-12345!' }),
  });
  assert.equal(missing.status, 400);
});

test('produção: WebAuthn usa o RP canônico e cadastro exige sessão', async () => {
  const challenge = await request('/api/auth/passkey/generate-authenticate-options');
  assert.equal(challenge.status, 200);
  const options = await challenge.json();
  assert.equal(options.rpId, site.hostname);
  assert.ok(options.challenge);
  assert.equal((await request('/api/auth/passkey/list-user-passkeys')).status, 401);
  assert.equal((await request('/api/auth/passkey/generate-register-options')).status, 401);
});

test('produção: cadastro público, OAuth e callbacks antigos são bloqueados', async () => {
  const paths = ['/sign-up/email', '/sign-in/social', '/sign-in/supabase'];
  for (const path of paths) {
    const response = await request(`/api/auth${path}`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', email: 'blocked@example.test', password: 'Test-Password-12345!', name: 'Blocked', callbackURL: '/conta' }),
    });
    if (path === '/sign-up/email' && response.status === 400) {
      // Turnstile can reject before Better Auth's disabled-signup hook.
      // The isolated integration suite also verifies the hook with CAPTCHA off.
      assert.equal((await response.json()).code, 'MISSING_RESPONSE', path);
    } else {
      assert.equal(response.status, path === '/sign-in/supabase' ? 404 : 403, path);
    }
  }
  for (const path of ['/callback/google', '/callback/github', '/supabase/callback']) {
    const response = await request(`/api/auth${path}?error=access_denied`);
    assert.equal(response.status, path === '/supabase/callback' ? 404 : 403, path);
  }
});
