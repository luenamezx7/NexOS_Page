import test from 'node:test';
import assert from 'node:assert/strict';

const site = new URL(process.env.AUTH_SMOKE_URL || 'https://nexoslab.online');
assert.equal(site.protocol, 'https:', 'A homologação remota exige HTTPS.');
const origin = site.origin;
const request = (path, options = {}) => fetch(new URL(path, origin), {
  redirect: 'manual', signal: AbortSignal.timeout(30000), ...options,
});

test('produção: páginas de acesso renderizam e anunciam os métodos configurados', async () => {
  const response = await request('/portal/acesso');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('Google') && html.includes('GitHub') && html.includes('Entrar com chave de acesso'));
  assert.match(response.headers.get('content-security-policy'), /nonce-/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal((await request('/admin-dashboard-su/secure-entry')).status, 200);
  assert.equal((await request('/portal/redefinir')).status, 200);
});

test('produção: rotas privadas preservam destino e cookie forjado não autentica', async () => {
  for (const path of ['/conta', '/dashboard', '/portal/seguranca']) {
    const response = await request(path);
    assert.equal(response.status, 307);
    assert.equal(new URL(response.headers.get('location'), origin).searchParams.get('callbackUrl'), path);
  }
  const forged = await request('/conta', { headers: { Cookie: '__Secure-nexos.session_token=forged' } });
  assert.equal(forged.status, 307);
  assert.equal((await request('/api/account/profile')).status, 401);
  assert.equal((await request('/api/auth/session')).status, 401);
  assert.equal(await (await request('/api/auth/get-session')).json(), null);
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

for (const provider of ['google', 'github']) {
  test(`produção: OAuth ${provider} inicia com callback correto e trata cancelamento`, async () => {
    // Só inicia e cancela. Não simula consentimento nem cria contas.
    const started = await request('/api/auth/sign-in/social', { method: 'POST',
      headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, callbackURL: '/conta', errorCallbackURL: '/portal/acesso?confirmation=error&callbackUrl=%2Fconta' }),
    });
    assert.equal(started.status, 200);
    const authorization = new URL((await started.json()).url);
    assert.equal(authorization.hostname, provider === 'google' ? 'accounts.google.com' : 'github.com');
    assert.equal(authorization.searchParams.get('redirect_uri'), `${origin}/api/auth/callback/${provider}`);
    const state = authorization.searchParams.get('state');
    assert.ok(state);
    const cookies = started.headers.getSetCookie();
    assert.ok(cookies.length > 0);
    assert.ok(cookies.every(cookie => /Secure/i.test(cookie) && /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie)));
    const cancelled = await request(`/api/auth/callback/${provider}?error=access_denied&state=${encodeURIComponent(state)}`, {
      headers: { Cookie: cookies.map(cookie => cookie.split(';')[0]).join('; ') },
    });
    assert.equal(cancelled.status, 302);
    const location = new URL(cancelled.headers.get('location'), origin);
    assert.equal(location.origin, origin);
    assert.equal(location.pathname, '/portal/acesso');
    assert.equal(location.searchParams.get('confirmation'), 'error');
    assert.equal(location.searchParams.get('callbackUrl'), '/conta');
  });
}
