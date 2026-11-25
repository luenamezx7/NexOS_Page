import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import nextEnv from '@next/env';
import { chromium, expect } from '@playwright/test';
import { createPool } from '../src/lib/auth/db.ts';
import { createAuth } from '../src/lib/auth/instance.ts';

nextEnv.loadEnvConfig(process.cwd());
const site = new URL(process.env.PORTAL_UI_URL || 'http://localhost:3100');
assert.ok(['localhost', '127.0.0.1'].includes(site.hostname), 'Este teste só pode abrir a aplicação local.');
const output = 'test-results/portal-authenticated-ui';

test('local customer portal renders glass with an authorized disposable session', { timeout: 120000 }, async () => {
  const pool = createPool();
  const email = `portal-ui-${randomUUID()}@example.test`;
  const password = `Test-${randomUUID()}-Aa1!`;
  let userId, browser;
  try {
    let confirmation;
    const fixture = createAuth({ pool, siteURL: site.origin, allowServerProvisioning: true, notifications: false, captchaEnabled: false,
      mail: { verification: async ({ url }) => { confirmation = url; }, reset: async () => {}, magic: async () => {} },
    });
    const created = await fixture.api.createUser({ body: { email, name: 'Cliente de teste visual', password, role: 'user' } });
    userId = created.user.id;
    await fixture.api.sendVerificationEmail({ body: { email, callbackURL: '/portal/acesso?verified=1' } });
    assert.ok(confirmation);
    const verification = await fixture.handler(new Request(confirmation, { headers: { Origin: site.origin } }));
    assert.equal(verification.status, 302);
    const login = await fixture.handler(new Request(new URL('/api/auth/sign-in/email', site), {
      method: 'POST', headers: { Origin: site.origin, 'Content-Type': 'application/json', 'x-forwarded-for': '198.51.100.210' }, body: JSON.stringify({ email, password }),
    }));
    assert.equal(login.status, 200);
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addCookies(login.headers.getSetCookie().filter(cookie => !/max-age=0/i.test(cookie)).map(cookie => {
      const pair = cookie.split(';')[0], index = pair.indexOf('=');
      return { name: pair.slice(0, index), value: pair.slice(index + 1), url: site.origin, httpOnly: true, secure: false, sameSite: 'Lax' };
    }));
    await context.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    const page = await context.newPage();
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    const profile = { email, fullName: 'Cliente de teste visual', phone: '(11) 98765-4321', emailConfirmed: true, twoFactorEnabled: false, lastSignIn: '2026-11-21T12:00:00Z', createdAt: '2026-10-01T12:00:00Z' };
    await page.route('**/api/account/profile', route => route.fulfill({ json: profile }));
    mkdirSync(output, { recursive: true });
    for (const width of [390, 820, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(new URL('/conta', site).href);
      await expect(page.getByRole('heading', { name: 'Minha conta', exact: true })).toBeVisible();
      await expect(page.locator('[data-silk-background]')).toHaveAttribute('data-silk-state', 'static');
      await expect(page.getByRole('heading', { name: 'Seu perfil', exact: true })).toBeVisible();
      await expect(page.locator('[data-portal-glass]:visible')).toHaveCount(3);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const material = await page.locator('[data-portal-glass]:visible').first().evaluate(element => ({ background: getComputedStyle(element).backgroundColor, filter: getComputedStyle(element).backdropFilter, color: getComputedStyle(element).color }));
      assert.notEqual(material.background, 'rgb(255, 255, 255)');
      assert.ok(material.filter.includes('blur'));
      await page.screenshot({ path: `${output}/account-${width}.png`, fullPage: true });
      await page.getByRole('button', { name: 'Editar', exact: true }).click();
      await page.getByLabel('Nome completo', { exact: true }).fill('Nome em edição');
      await expect(page.getByLabel('Nome completo', { exact: true })).toBeFocused();
      await page.getByRole('button', { name: 'Cancelar', exact: true }).last().click();
      await expect(page.getByRole('button', { name: 'Editar', exact: true })).toBeVisible();
      await page.goto(new URL('/portal/seguranca', site).href);
      await expect(page.getByRole('heading', { name: 'Segurança da conta', exact: true })).toBeVisible();
      await expect(page.getByText('Nenhuma chave de acesso cadastrada.', { exact: true })).toBeVisible();
      await expect(page.locator('[data-portal-glass]:visible')).toHaveCount(3);
      await expect(page.locator('[data-silk-background]')).toHaveCount(1);
      await page.getByLabel('Nova senha', { exact: true }).fill('Ainda-nao-salvar-123!');
      await expect(page.getByLabel('Nova senha', { exact: true })).toBeFocused();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: `${output}/security-${width}.png`, fullPage: true });
    }
    // Verify the shell during loading and failed profile requests without touching real data.
    await page.unroute('**/api/account/profile');
    let release;
    await page.route('**/api/account/profile', async route => { await new Promise(resolve => { release = resolve; }); await route.fulfill({ status: 503, json: {} }); });
    await page.goto(new URL('/conta', site).href);
    await expect(page.getByRole('status', { name: 'Carregando sua conta' })).toBeVisible();
    await expect.poll(() => typeof release).toBe('function');
    release();
    await expect(page.getByText('Erro ao carregar', { exact: true })).toBeVisible();
    await expect(page.locator('[data-silk-background]')).toHaveCount(1);
    await page.unroute('**/api/account/profile');
    await page.route('**/api/account/profile', route => route.fulfill({ json: profile }));
    await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Seu perfil', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await expect(page).toHaveURL(new URL('/portal/acesso', site).href);
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
    assert.deepEqual(failures, []);
  } finally {
    try { await browser?.close(); }
    finally {
      if (userId) {
        await pool.query('delete from public."user" where id = $1 and email = $2', [userId, email]);
        const remaining = await pool.query('select count(*)::int as count from public."user" where id = $1 and email = $2', [userId, email]);
        assert.equal(remaining.rows[0].count, 0, 'A fixture deve ser removida ao final');
      }
      await pool.end();
    }
  }
});
