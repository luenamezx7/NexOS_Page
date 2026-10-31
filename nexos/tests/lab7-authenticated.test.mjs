import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import nextEnv from '@next/env';
import pg from 'pg';
import { chromium, expect } from '@playwright/test';
import { createAuth } from '../src/lib/auth/instance.ts';

nextEnv.loadEnvConfig(process.cwd());
const SITE = 'http://localhost:3117';

// Only a disposable fixture is provisioned through the existing SDK. The browser
// then talks to the actual Next.js handler: no intercepted auth/session requests.
test('LAB 7: header reflects a real persisted session, image, mobile actions and logout', { timeout: 120000 }, async () => {
  const email = `lab7-${randomUUID()}@example.invalid`;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, max: 2 });
  let userId, browser, server;
  try {
    assert.ok(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
    let verification;
    const fixture = createAuth({ pool, siteURL: SITE, notifications: false, captchaEnabled: false, socialProviders: {}, mail: { verification: async ({ url }) => { verification = url; }, reset: async () => {}, magic: async () => {} } });
    const sdk = (path, body, cookie = '') => fixture.handler(new Request(`${SITE}/api/auth${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Origin: SITE, Cookie: cookie, 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.117' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }));
    const password = `Lab7-${randomUUID()}-Aa1!`;
    const signup = await sdk('/sign-up/email', { email, password, name: 'Cliente LAB 7' });
    assert.equal(signup.status, 200); userId = (await signup.json()).user.id;
    const link = new URL(verification);
    assert.equal((await sdk(link.pathname.replace('/api/auth', '') + link.search)).status, 302);
    const login = await sdk('/sign-in/email', { email, password });
    assert.equal(login.status, 200);

    server = spawn(process.execPath, ['--use-system-ca', 'node_modules/next/dist/bin/next', 'start', '-p', '3117'], { env: { ...process.env, SITE_URL: SITE, TURNSTILE_ENFORCED: 'false' }, stdio: 'ignore' });
    for (let i = 0; i < 60; i++) {
      try { if ((await fetch(`${SITE}/api/health`)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    browser = await chromium.launch();
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    await context.addCookies(login.headers.getSetCookie().filter(value => !/max-age=0/i.test(value)).map(value => {
      const pair = value.split(';')[0], equals = pair.indexOf('=');
      return { name: pair.slice(0, equals), value: pair.slice(equals + 1), url: SITE, httpOnly: true, sameSite: 'Lax' };
    }));
    const page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto(SITE);
    await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('header [data-account-state]')).toHaveAttribute('data-account-state', 'authenticated');
    assert.equal((await (await context.request.get(`${SITE}/api/auth/get-session`)).json()).user.id, userId);
    const profile = page.getByRole('button', { name: 'Abrir opções da conta' });
    await expect(profile.locator('[data-slot="avatar-fallback"]')).toBeVisible();
    await profile.click(); await page.getByRole('menuitem', { name: 'Minha conta', exact: true }).click();
    await page.waitForURL(`${SITE}/conta`);
    const cookie = (await context.cookies()).map(value => `${value.name}=${value.value}`).join('; ');
    assert.equal((await sdk('/update-user', { image: `${SITE}/favicon.png` }, cookie)).status, 200);
    await page.goto(SITE);
    await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(profile.locator('img')).toHaveAttribute('src', `${SITE}/favicon.png`);
    await page.setViewportSize({ width: 375, height: 844 });
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('dialog', { name: 'Explore a NexOS' });
    await expect(menu.getByRole('link', { name: 'Segurança da conta' })).toHaveAttribute('href', '/portal/seguranca');
    await menu.getByRole('button', { name: 'Sair da conta' }).click();
    await page.waitForURL(`${SITE}/portal/acesso`);
    assert.equal(await (await context.request.get(`${SITE}/api/auth/get-session`)).json(), null);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(SITE);
    await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByRole('banner').getByRole('link', { name: 'Minha conta', exact: true })).toHaveAttribute('href', '/portal/acesso');
  } finally {
    await browser?.close();
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
    if (userId) {
      await pool.query('delete from public."user" where id = $1 and email = $2', [userId, email]);
      const remaining = await pool.query('select count(*)::int as count from public."user" where id = $1 and email = $2', [userId, email]);
      assert.equal(remaining.rows[0].count, 0);
    }
    await pool.end();
  }
});
