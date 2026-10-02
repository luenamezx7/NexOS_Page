import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nextEnv from '@next/env';
import pg from 'pg';
import { chromium, expect } from '@playwright/test';
import { createOTP } from '@better-auth/utils/otp';
import { base32 } from '@better-auth/utils/base32';
import { createAuth } from '../src/lib/auth/instance.ts';

nextEnv.loadEnvConfig(process.cwd());
const SITE = 'https://nexoslab.online';

test('produção autenticada: RSC, senha, Passkey, TOTP e outbox com conta descartável', { timeout: 180000 }, async () => {
  const email = `delivered+nexos-${randomUUID()}@resend.dev`;
  const password = `Test-${randomUUID()}-Aa1!`;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, max: 2 });
  let userId, browser;
  try {
    assert.ok(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
    let confirmation;
    // Provisiona somente a fixture pelo SDK local. Isso não homologa CAPTCHA
    // nem entrega de confirmação; as operações seguintes usam o deploy real.
    const fixture = createAuth({ pool, siteURL: SITE, captchaEnabled: false, notifications: false, socialProviders: {},
      mail: { verification: async ({ url }) => { confirmation = url; }, reset: async () => {}, magic: async () => {} },
    });
    const localRequest = (path, body) => fixture.handler(new Request(new URL(`/api/auth${path}`, SITE), {
      method: body === undefined ? 'GET' : 'POST', headers: { Origin: SITE, 'Content-Type': 'application/json', 'x-forwarded-for': `198.51.100.${parseInt(randomUUID().slice(0, 2), 16)}` },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }));
    const signup = await localRequest('/sign-up/email', { email, password, name: 'Homologação descartável' });
    assert.equal(signup.status, 200);
    userId = (await signup.json()).user.id;
    assert.ok(confirmation);
    const link = new URL(confirmation);
    assert.equal((await localRequest(link.pathname.replace('/api/auth', '') + link.search)).status, 302);
    const login = await localRequest('/sign-in/email', { email, password });
    assert.equal(login.status, 200);
    browser = await chromium.launch();
    const context = await browser.newContext();
    await context.addCookies(login.headers.getSetCookie().filter(cookie => !/max-age=0/i.test(cookie)).map(cookie => {
      const pair = cookie.split(';')[0], equals = pair.indexOf('=');
      return { name: pair.slice(0, equals), value: pair.slice(equals + 1), url: SITE, httpOnly: true, secure: true, sameSite: 'Lax' };
    }));
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('WebAuthn.enable');
    await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal',
      hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } });
    assert.equal((await page.goto(`${SITE}/conta`)).status(), 200);
    assert.equal(new URL(page.url()).pathname, '/conta');
    await page.getByRole('dialog', { name: 'Aviso de cookies' }).getByRole('button', { name: 'Recusar', exact: true }).click();
    assert.equal((await page.goto(`${SITE}/portal/seguranca`)).status(), 200);
    await expect(page.getByRole('heading', { name: 'Segurança da conta', exact: true })).toBeVisible();
    const changed = `${password}-Updated2!`;
    await page.getByLabel('Senha atual', { exact: true }).first().fill(password);
    await page.getByLabel('Nova senha', { exact: true }).fill(changed);
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill(changed);
    await page.getByRole('button', { name: 'Trocar senha', exact: true }).click();
    await expect(page.locator('[data-slot="alert"]').filter({ hasText: 'Senha atualizada' })).toBeVisible({ timeout: 30000 });
    await page.getByLabel('Nome da chave de acesso').fill('Autenticador virtual de homologação');
    await page.getByRole('button', { name: 'Cadastrar chave de acesso', exact: true }).click();
    await expect(page.locator('[data-slot="alert"]').filter({ hasText: 'Chave de acesso cadastrada' })).toBeVisible({ timeout: 30000 });
    await page.locator('#mfa-current').fill(changed);
    await page.getByRole('button', { name: 'Ativar autenticador', exact: true }).click();
    await expect(page.locator('details code')).toBeAttached({ timeout: 30000 });
    const secret = new TextDecoder().decode(base32.decode(await page.locator('details code').textContent()));
    await page.getByLabel('Código do aplicativo').fill(await createOTP(secret).totp());
    await page.getByRole('button', { name: 'Confirmar autenticador', exact: true }).click();
    await expect(page.locator('[data-slot="alert"]').filter({ hasText: 'Autenticador ativado' })).toBeVisible({ timeout: 30000 });
    await expect(page.getByRole('region', { name: 'Códigos de recuperação' })).toBeVisible();
    await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
    await page.goto(`${SITE}/portal/acesso?callbackUrl=%2Fconta`);
    await page.getByRole('button', { name: 'Entrar com chave de acesso' }).click();
    await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible({ timeout: 30000 });
    assert.equal(await page.evaluate(async () => (await fetch('/api/auth/get-session')).json()), null);
    await page.getByLabel('Código do autenticador', { exact: true }).fill(await createOTP(secret).totp());
    await page.getByRole('button', { name: 'Confirmar acesso', exact: true }).click();
    await page.waitForURL(`${SITE}/conta`, { timeout: 30000 });
    const profile = await page.evaluate(async () => {
      const response = await fetch('/api/account/profile'); return { status: response.status, data: await response.json() };
    });
    assert.equal(profile.status, 200);
    // Usuário comum não ganha acesso ao painel administrativo nem após MFA.
    await page.goto(`${SITE}/dashboard`);
    assert.equal(new URL(page.url()).pathname, '/admin-dashboard-su/secure-entry');
    await page.goto(`${SITE}/portal/seguranca`);
    await page.locator('#backup-password').fill(changed);
    await page.getByRole('button', { name: 'Gerar novos códigos de recuperação', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Códigos de recuperação' })).toBeVisible({ timeout: 30000 });
    const backupCode = await page.getByRole('region', { name: 'Códigos de recuperação' }).locator('li').first().textContent();
    await page.evaluate(() => fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
    await page.goto(`${SITE}/portal/acesso?callbackUrl=%2Fconta`);
    await page.getByRole('button', { name: 'Entrar com chave de acesso' }).click();
    await page.getByRole('button', { name: 'Usar código de recuperação', exact: true }).click();
    await page.getByLabel('Código de recuperação', { exact: true }).fill(backupCode);
    await page.getByRole('button', { name: 'Confirmar acesso', exact: true }).click();
    await page.waitForURL(`${SITE}/conta`, { timeout: 30000 });
    await page.goto(`${SITE}/portal/seguranca`);
    await page.locator('#mfa-disable-password').fill(changed);
    await page.getByRole('button', { name: 'Desativar autenticador', exact: true }).click();
    await expect(page.locator('[data-slot="alert"]').filter({ hasText: 'Autenticador desativado' })).toBeVisible({ timeout: 30000 });
    await page.getByRole('button', { name: 'Remover', exact: true }).click();
    await page.getByRole('button', { name: 'Confirmar remoção', exact: true }).click();
    await expect(page.getByText('Nenhuma chave de acesso cadastrada.', { exact: true })).toBeVisible({ timeout: 30000 });
    const delivery = await pool.query(`select payload->>'kind' as kind, status from public.auth_email_outbox where user_id = $1`, [userId]);
    for (const kind of ['welcome', 'login', 'security']) {
      assert.ok(delivery.rows.some(row => row.kind === kind && row.status === 'sent'), `${kind}: envio pelo deploy precisa estar registrado como aceito`);
    }
    await page.goto(`${SITE}/conta`);
    const oldCookies = (await context.cookies()).map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
    await page.waitForURL(`${SITE}/portal/acesso`, { timeout: 30000 });
    assert.equal(await page.evaluate(async () => (await fetch('/api/auth/get-session')).json()), null);
    const revoked = await context.request.get(`${SITE}/api/auth/get-session`, { headers: { Cookie: oldCookies } });
    assert.equal(await revoked.json(), null, 'Sair pelo botão deve revogar a sessão também no banco');
  } finally {
    await browser?.close();
    // Escopo duplo: nunca remove uma conta preexistente ou fora desta fixture.
    if (userId) {
      await pool.query('delete from public."user" where id = $1 and email = $2', [userId, email]);
      const remaining = await pool.query('select count(*)::int as count from public."user" where id = $1', [userId]);
      assert.equal(remaining.rows[0].count, 0, 'Conta temporária deve ser removida');
    }
    await pool.end();
  }
});
