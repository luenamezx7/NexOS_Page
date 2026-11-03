import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonBody, isSameOrigin } from '../src/lib/request-security.ts';
import { evaluatePassword } from '../src/lib/auth/password-strength.ts';
import { sanitizeCallbackPath } from '../src/lib/auth/callback.ts';
import { authErrorMessage } from '../src/lib/auth/error-message.ts';

test('auth errors never disclose whether an account exists', () => {
  const neutral = 'Se os dados estiverem corretos, continue.';

  // "Conta não existe" e "conta já existe" precisam ser indistinguíveis:
  // o mesmo texto neutro nos dois casos, senão qualquer formulário enumerator de contas.
  for (const code of [
    'USER_NOT_FOUND', 'user_not_found',
    'USER_ALREADY_EXISTS', 'user_already_exists',
    'EMAIL_ALREADY_EXISTS', 'email_exists', 'email_already_exists',
    'EMAIL_NOT_VERIFIED', 'email_not_verified',
    'INVALID_EMAIL_OR_PASSWORD', 'CREDENTIALS_NOT_FOUND',
  ]) {
    assert.equal(authErrorMessage({ code, status: 400, message: 'User not found' }, neutral), neutral);
  }

  // Falhas que o usuário pode agir sobre continuam informativo.
  assert.match(authErrorMessage({ code: 'captcha_failed', status: 400 }, neutral), /Verificação de segurança/);
  assert.match(authErrorMessage({ code: 'TOO_MANY_REQUESTS', status: 429 }, neutral), /Muitas tentativas/);

  // Ruído e formatos inesperados caem no texto neutro.
  for (const value of [null, undefined, {}, 42, 'texto', { message: '' }]) {
    assert.equal(authErrorMessage(value, neutral), neutral);
  }
});

test('auth errors never leak stack traces or internal detail', () => {
  const neutral = 'Tente novamente.';
  const stack = 'Error: boom\n    at handler (/app/src/lib/auth/instance.ts:42:9)';
  assert.equal(authErrorMessage({ code: 'UNEXPECTED', message: stack }, neutral), neutral);
  assert.equal(authErrorMessage({ code: 'UNEXPECTED', message: 'x'.repeat(500) }, neutral), neutral);
});

test('request limits reject oversized chunks without trusting Content-Length', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(65))); },
    cancel() { cancelled = true; },
  });
  const request = new Request('http://localhost/api', { method: 'POST', body: stream, duplex: 'half' });
  await assert.rejects(readJsonBody(request, 64), { status: 413 });
  assert.equal(cancelled, true);
});

test('JSON limits count UTF-8 bytes and reject malformed JSON', async () => {
  await assert.rejects(readJsonBody(new Request('http://localhost', { method: 'POST', body: '"ááá"' }), 7), { status: 413 });
  await assert.rejects(readJsonBody(new Request('http://localhost', { method: 'POST', body: '{' })), { status: 400 });
  assert.deepEqual(await readJsonBody(new Request('http://localhost', { method: 'POST', body: '{"ok":true}' })), { ok: true });
});

test('same-origin protection rejects missing, foreign and cross-site origins', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://nexos.example';
  try {
    const make = headers => new Request('https://nexos.example/api/auth/login', { headers });
    assert.equal(isSameOrigin(make({ Origin: 'https://nexos.example' })), true);
    assert.equal(isSameOrigin(make({ Origin: 'https://www.nexos.example' })), true);
    assert.equal(isSameOrigin(make({})), false);
    assert.equal(isSameOrigin(make({ Origin: null })), false);
    assert.equal(isSameOrigin(make({ Origin: 'https://attacker.example' })), false);
    assert.equal(isSameOrigin(make({ Origin: 'https://nexos.example', 'Sec-Fetch-Site': 'cross-site' })), false);
    assert.equal(isSameOrigin(make({ Origin: 'http://nexos.example' })), false);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test('password strength requires length, cases, number and symbol', () => {
  assert.equal(evaluatePassword('').acceptable, false);
  assert.equal(evaluatePassword('aaaaaaaaaaaaaaa').acceptable, false);
  assert.equal(evaluatePassword('Aa1!short').acceptable, false);
  assert.equal(evaluatePassword('Aa1!longenoughxx').acceptable, true);
  assert.equal(evaluatePassword('Strong-Passw0rd!xyz').acceptable, true);
  assert.equal(evaluatePassword('Strong-Passw0rd!xyz').score, 4);
  assert.ok(evaluatePassword('Aa1!longenoughxx').requirements.every(r => r.met));
});

test('callback URLs only accept internal paths (no open redirect)', () => {
  assert.equal(sanitizeCallbackPath('/criacao-de-sites?origem=menu'), '/criacao-de-sites?origem=menu');
  assert.equal(sanitizeCallbackPath('//evil.example'), null);
  assert.equal(sanitizeCallbackPath('/\\evil.example'), null);
  assert.equal(sanitizeCallbackPath('https://evil.example'), null);
  assert.equal(sanitizeCallbackPath('javascript:alert(1)'), null);
  assert.equal(sanitizeCallbackPath(''), null);
  assert.equal(sanitizeCallbackPath(null), null);
  assert.equal(sanitizeCallbackPath('/'.repeat(600)), null);
});

test('callbacks reject URL normalization tricks and recursive auth destinations', () => {
  for (const path of ['/\t/evil.example', '/%5cevil.example', '/%2f%2fevil.example', '/a/../portal/acesso', '/portal/acesso?callbackUrl=/conta', '/auth/callback', '/api/auth/user-logout', '/login', '/entrar', '/%ZZ']) {
    assert.equal(sanitizeCallbackPath(path), null, path);
  }
  assert.equal(sanitizeCallbackPath('/?origem=menu#services'), '/?origem=menu#services');
  assert.equal(sanitizeCallbackPath('/portal/redefinir'), '/portal/redefinir');
});

test('callbacks reject repeated query parameters and non-string input', () => {
  for (const value of [['/conta', '/dashboard'], {}, 1, true]) {
    assert.equal(sanitizeCallbackPath(value), null);
  }
});
