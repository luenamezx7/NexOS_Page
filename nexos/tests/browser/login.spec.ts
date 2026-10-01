import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
});

test('login hydrates with nonce CSP; controls work in desktop and mobile themes', async ({ page }) => {
  const violations: string[] = [];
  page.on('pageerror', error => violations.push(error.message));
  page.on('console', message => { if (/violates.*Content Security Policy|hydration/i.test(message.text())) violations.push(message.text()); });
  const response = await page.goto('/admin-dashboard-su/secure-entry');
  expect(response?.headers()['content-security-policy']).toContain("'nonce-");
  expect(response?.headers()['content-security-policy']).not.toContain("'unsafe-eval'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(violations).toEqual([]);
});

test('legacy auth URLs redirect to the canonical routes', async ({ request }) => {
  const user = await request.get('/entrar', { maxRedirects: 0 });
  expect(user.status()).toBe(308); expect(user.headers().location).toContain('/portal/acesso');
  const admin = await request.get('/login', { maxRedirects: 0 });
  expect(admin.status()).toBe(308); expect(admin.headers().location).toContain('/admin-dashboard-su/secure-entry');
});

test('private pages preserve callback and a forged cookie cannot authorize RSC', async ({ request }) => {
  for (const path of ['/conta', '/portal/seguranca', '/dashboard']) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, 'http://localhost:3100').searchParams.get('callbackUrl')).toBe(path);
  }
  const forged = await request.get('/conta', { headers: { Cookie: 'nexos.session_token=forged' }, maxRedirects: 0 });
  expect(forged.status()).toBe(307);
  expect(forged.headers().location).toContain('/portal/acesso');
  const csrf = await request.post('/api/auth/sign-in/email', { headers: { Origin: 'https://attacker.example' }, data: {} });
  expect(csrf.status()).toBe(403);
});

test('password and MFA errors render accessibly against current Better Auth endpoints', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ json: { twoFactorRedirect: true } }));
  await page.route('**/api/auth/two-factor/verify-totp', route => route.fulfill({ status: 401, json: { code: 'INVALID_CODE', message: 'Invalid code' } }));
  await page.goto('/portal/acesso?callbackUrl=%2Fconta');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible();
  await page.getByLabel('Código do autenticador').fill('123456');
  await page.getByRole('button', { name: 'Confirmar acesso' }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText('Código inválido ou expirado');
  await page.getByRole('button', { name: 'Usar código de recuperação' }).click();
  await expect(page.getByLabel('Código de recuperação')).toBeVisible();
});

test('signup validates passwords and shows email confirmation', async ({ page }) => {
  await page.route('**/api/auth/sign-up/email', route => route.fulfill({ json: { user: { email: 'customer@example.test' } } }));
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Cliente Teste');
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Different-Password-12345!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText('As senhas precisam ser iguais');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Confirme seu e-mail' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reenviar e-mail de confirmação' })).toBeVisible();
});

test('forgot password and magic link submit to current endpoints; errors never stick busy state', async ({ page }) => {
  await page.route('**/api/auth/request-password-reset', route => route.fulfill({ json: { status: true } }));
  await page.route('**/api/auth/sign-in/magic-link', route => route.fulfill({ status: 503, json: { code: 'EMAIL_UNAVAILABLE' } }));
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Esqueceu a senha?', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.test');
  await page.getByRole('button', { name: 'Enviar link de redefinição' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Se houver uma conta ativa' })).toBeVisible();
  await page.getByRole('button', { name: 'Voltar ao login' }).click();
  await page.getByRole('button', { name: 'Entrar por link de e-mail' }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.test');
  await page.getByRole('button', { name: 'Enviar link de acesso' }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText('temporariamente indisponível');
  await expect(page.getByRole('button', { name: 'Enviar link de acesso' })).toBeEnabled();
});
