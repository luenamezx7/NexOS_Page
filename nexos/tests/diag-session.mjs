// Temporary diagnostic: reproduce the production path — recovery session cookie,
// no tokenHash — and surface the real updateUser error.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import env from '@next/env';
import { createAdminClient } from '@supabase/server/core';
import { createServerClient } from '@supabase/ssr';

env.loadEnvConfig(process.cwd());
const url = process.env.SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin = createAdminClient({ env: { url, secretKeys: { default: secret } } });
const run = randomUUID();
const origin = 'http://localhost:3215';
const email = `nexos-sess-${run}@example.com`;
const oldPassword = `${randomUUID()}-Aa9!`;
const newPassword = `${randomUUID()}-Zz8?`;
let server;
let userId;

try {
  const probe = createServer();
  await new Promise((res, rej) => { probe.once('error', rej); probe.listen(3215, () => probe.close(res)); });
  const created = await admin.auth.admin.createUser({ email, password: oldPassword, email_confirm: true, user_metadata: { integration_test: run } });
  assert.equal(created.error, null);
  userId = created.data.user.id;
  server = spawn(process.execPath, ['--use-system-ca', 'node_modules/next/dist/bin/next', 'start', '-p', '3215'], {
    env: { ...process.env, SITE_URL: origin, DASHBOARD_ADMIN_USER_IDS: userId, TURNSTILE_ENFORCED: 'false',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'k', TURNSTILE_SECRET_KEY: 'k', CHECKOUT_STATUS_SECRET: randomUUID() + randomUUID() },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  server.on('error', e => { throw e; });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch(`${origin}/api/security/config`, { signal: AbortSignal.timeout(2000) })).ok; } catch {}
    if (ready) break;
    await new Promise(r => setTimeout(r, 500));
  }
  assert.ok(ready, 'server did not start');

  // Build a genuine recovery session, exactly like the emailed link produces.
  const link = await admin.auth.admin.generateLink({ type: 'recovery', email });
  assert.equal(link.error, null, `generateLink: ${link.error?.message ?? ''}`);
  const collected = new Map();
  const client = createServerClient(url, publishable, {
    cookies: {
      getAll: () => [],
      setAll: list => list.forEach(({ name, value }) => collected.set(name, value)),
    },
  });
  const verified = await client.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'recovery' });
  console.log('verifyOtp error:', verified.error?.message ?? 'nenhum');
  const jar = [...collected].map(([k, v]) => `${k}=${v}`).join('; ');
  console.log('cookies de sessao:', [...collected.keys()].join(', ') || '(nenhum)');

  // Exactly what the form posts in the emailed-link flow: no tokenHash.
  const res = await fetch(`${origin}/api/auth/user-reset`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin, 'x-forwarded-for': `${run}-r`, cookie: jar },
    body: JSON.stringify({ password: newPassword }),
  });
  console.log('RESET (so sessao) status:', res.status, 'body:', await res.text());

  // And what a still-unconfirmed fresh account does, for contrast.
  const unconfirmed = await admin.auth.admin.createUser({ email: `nexos-unc-${run}@example.com`, password: oldPassword, email_confirm: false, user_metadata: { integration_test: run } });
  if (!unconfirmed.error) {
    await admin.auth.admin.deleteUser(unconfirmed.data.user.id);
  }
} finally {
  if (server && server.exitCode === null) { const e = once(server, 'exit'); server.kill(); await e; }
  if (userId) { const { error } = await admin.auth.admin.deleteUser(userId); if (error) console.error('cleanup', userId); }
  console.log('fixture removed.');
}
