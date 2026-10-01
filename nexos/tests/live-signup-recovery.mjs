// ============================================================================
// ⚠️  TESTE INVALIDADO — NÃO HÁ MAIS O QUE TESTAR AQUI
//
// Este arquivo validava o fluxo do Supabase Auth e foi deixado intacto de
// propósito, para não dar aparência de cobertura enquanto aponta para um sistema
// removido. Ele depende de:
//   - POST /api/auth/user-login          (rota removida)
//   - resposta `enrollmentRequired`       (modelo antigo de MFA)
//   - /api/auth/session retornar 403     (sem 2FA) — o Better Auth não emite
//                                         sessão enquanto o desafio está aberto
//   - tabela auth_rate_limits            (o Better Auth usa "rateLimit")
//   - admin.auth.admin.createUser/deleteUser (GoTrue)
//
// Reescrever isto é trabalho em série, não uma troca de import: o fluxo E2E
// precisa ser repensado em torno de authClient e do plugin twoFactor.
// Cobre-se o essencial em tests/better-auth.test.mjs enquanto isso não existir.
// ============================================================================

// Live test for the two reported defects:
// 1) signup warns "O E-mail já está em uso." only when the address really exists
// 2) a password-recovery link opens the reset form and the new password is stored
// Disposable fixtures are created and removed; no email is delivered.
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import env from '@next/env';
import { createAdminClient } from '@supabase/server/core';

env.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
assert.ok(url && secret, 'Supabase server configuration required');
const admin = createAdminClient({ env: { url, secretKeys: { default: secret } } });
const run = randomUUID();
const origin = 'http://localhost:3212';
const password = `${randomUUID()}-Aa9!`;
const newPassword = `${randomUUID()}-Zz8?`;
const takenEmail = `nexos-signup-taken-${run}@example.com`;
const pendingEmail = `nexos-signup-pending-${run}@example.com`;
const unusedEmail = `nexos-signup-unused-${run}@example.com`;
const recoverEmail = `nexos-recovery-${run}@example.com`;
const fixtures = [];
let server;

async function signup(email) {
  const response = await fetch(`${origin}/api/auth/user-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': `${run}-${randomUUID()}` },
    body: JSON.stringify({ email, password }),
  });
  return { status: response.status, body: await response.json() };
}

async function hashRateKeys() {
  const keys = [
    `auth:account:forgot:${recoverEmail.toLowerCase()}`,
    `auth:account:signup:${takenEmail.toLowerCase()}`,
    `auth:account:signup:${unusedEmail.toLowerCase()}`,
    `auth:account:signup:${pendingEmail.toLowerCase()}`,
    `auth:account:reset:${run}-reset`,
  ];
  return keys.map(key => createHmac('sha256', secret).update(key).digest('hex'));
}

try {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(3212, () => probe.close(resolve));
  });
  for (const email of [takenEmail, pendingEmail, recoverEmail]) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: email !== pendingEmail,
      user_metadata: { integration_test: run },
    });
    assert.equal(error, null, `Disposable fixture creation failed: ${error?.message ?? ''}`);
    fixtures.push(data.user.id);
  }
  server = spawn(process.execPath, ['--use-system-ca', 'node_modules/next/dist/bin/next', 'start', '-p', '3212'], {
    env: {
      ...process.env, SITE_URL: origin, DASHBOARD_ADMIN_USER_IDS: fixtures[0],
      TURNSTILE_ENFORCED: 'false', NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-runtime-public-key',
      TURNSTILE_SECRET_KEY: 'test-runtime-private-key', CHECKOUT_STATUS_SECRET: randomUUID() + randomUUID(),
    },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  server.on('error', error => { throw error; });
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try { ready = (await fetch(`${origin}/api/security/config`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Isolated test server failed to start');

  // ── Duplicate signup warning ────────────────────────────────────────────
  const taken = await signup(takenEmail);
  assert.equal(taken.status, 409, 'Existing address must be rejected');
  assert.equal(taken.body.error, 'O E-mail já está em uso.');
  assert.equal(taken.body.code, 'EMAIL_IN_USE');

  // Case and surrounding whitespace must not bypass the check.
  for (const variant of [takenEmail.toUpperCase(), `  ${takenEmail} `]) {
    const alt = await signup(variant);
    assert.equal(alt.status, 409, `Variant ${variant} must be rejected`);
    assert.equal(alt.body.error, 'O E-mail já está em uso.');
  }

  // A merely pending registration must stay hidden: no "in use" verdict.
  const pending = await signup(pendingEmail);
  assert.notEqual(pending.status, 409, 'A pending sign-up must not be disclosed as taken');

  // A genuinely unused address must never be reported as in use. Supabase Auth
  // itself requires a captcha token in this project, so the only acceptable
  // outcomes are "reached the provider" (not a duplicate verdict) or a captcha
  // rejection; a 409 EMAIL_IN_USE would be a false positive.
  const unused = await signup(unusedEmail);
  assert.notEqual(unused.status, 409, 'Unused address must not be reported as in use');
  const { data: unusedLookup } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  assert.equal(
    unusedLookup.users.some(user => user.email === unusedEmail),
    false,
    'Unused address must not be reported as in use',
  );

  // ── Password recovery ───────────────────────────────────────────────────
  const link = await admin.auth.admin.generateLink({ type: 'recovery', email: recoverEmail });
  assert.equal(link.error, null, `Recovery link generation failed: ${link.error?.message ?? ''}`);
  const tokenHash = link.data.properties.hashed_token;

  // The email link must not consume the one-time token on GET.
  const followed = await fetch(`${origin}/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=recovery&next=/portal/redefinir`, {
    redirect: 'manual',
    headers: { 'x-forwarded-for': `${run}-scanner` },
  });
  assert.equal(followed.status, 303, 'Recovery link must redirect instead of erroring');
  const location = new URL(followed.headers.get('location') ?? '', origin);
  assert.equal(location.pathname, '/portal/redefinir');
  assert.equal(location.searchParams.get('token_hash'), tokenHash);
  assert.equal(location.searchParams.get('recovery'), null, 'Scanner follow must not invalidate the link');

  // The reset page renders a real form, not "link inválido ou expirado".
  const form = await fetch(location, { headers: { 'x-forwarded-for': `${run}-reader` } });
  const html = await form.text();
  assert.equal(form.status, 200);
  assert.ok(html.includes('Defina nova senha'), 'Reset page must render the password form');
  assert.ok(!html.includes('Link inválido ou expirado'), 'Reset page must not reject a valid link');

  // Submitting the new password stores it.
  const reset = await fetch(`${origin}/api/auth/user-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': `${run}-reset` },
    body: JSON.stringify({ password: newPassword, tokenHash }),
  });
  const resetBody = await reset.json();
  assert.equal(reset.status, 200, `Password reset failed: ${JSON.stringify(resetBody)}`);
  assert.equal(resetBody.ok, true);

  // Supabase Auth requires a captcha token for password grants in this project,
  // so verify the stored credential through the service client instead.
  const { data: afterReset, error: lookupError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  assert.equal(lookupError, null);
  assert.equal(
    afterReset.users.some(user => user.email === recoverEmail),
    true,
    'Account must still exist after reset',
  );

  const withNew = await admin.auth.signInWithPassword({ email: recoverEmail, password: newPassword });
  assert.equal(withNew.error, null, `New password must be accepted: ${withNew.error?.message ?? ''}`);
  const withOld = await admin.auth.signInWithPassword({ email: recoverEmail, password });
  assert.notEqual(withOld.error, null, 'Old password must be rejected');

  // A consumed or tampered link is refused.
  const replay = await fetch(`${origin}/api/auth/user-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': `${run}-replay` },
    body: JSON.stringify({ password: `${randomUUID()}-Qq7!`, tokenHash }),
  });
  assert.equal(replay.status, 401, 'A consumed recovery link must be rejected');

  const tampered = await fetch(`${origin}/auth/callback?token_hash=${'a'.repeat(64)}&type=recovery&next=/portal/redefinir`, {
    redirect: 'manual', headers: { 'x-forwarded-for': `${run}-tamper` },
  });
  // A forged hash may render the form shape, but the POST is what verifies it.
  assert.equal(new URL(tampered.headers.get('location') ?? '', origin).pathname, '/portal/redefinir');
  const forged = await fetch(`${origin}/api/auth/user-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': `${run}-forged` },
    body: JSON.stringify({ password: `${randomUUID()}-Qq7!`, tokenHash: 'a'.repeat(64) }),
  });
  assert.equal(forged.status, 401, 'A forged recovery hash must never change a password');

  // A malformed hash never even reaches the form.
  const malformed = await fetch(`${origin}/auth/callback?token_hash=not-a-hash&type=recovery&next=/portal/redefinir`, {
    redirect: 'manual', headers: { 'x-forwarded-for': `${run}-malformed` },
  });
  assert.equal(
    new URL(malformed.headers.get('location') ?? '', origin).searchParams.get('recovery'),
    'error',
    'A malformed hash must be rejected before the form',
  );

  console.log('PASS: duplicate signup warning (confirmed only, case/whitespace variants, pending and unused hidden) and full password recovery (link, form, update, replay rejection).');
} finally {
  if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
  let cleanupFailed = false;
  for (const id of fixtures) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) { cleanupFailed = true; console.error(`Cleanup required for test Auth user ${id}`); }
  }
  // Rate-limit rows expire on their own window; a denied delete is not a leaked fixture.
  const hashes = await hashRateKeys();
  const { error: rateError } = await admin.from('auth_rate_limits').delete().in('key_hash', hashes);
  if (rateError) console.warn(`Rate-limit cleanup skipped (${rateError.code ?? ''}); entries expire on their own.`);
  assert.equal(cleanupFailed, false, 'Test fixture cleanup failed');
  console.log('Disposable Auth fixtures removed.');
}
