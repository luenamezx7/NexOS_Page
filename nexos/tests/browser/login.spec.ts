import { test, expect } from '@playwright/test';

test('login hydrates with nonce CSP; controls work in desktop and mobile themes', async ({ page }) => {
  const violations: string[] = [];
  page.on('pageerror', error => violations.push(error.message));
  page.on('console', message => { if (/violates.*Content Security Policy|hydration/i.test(message.text())) violations.push(message.text()); });
  const response = await page.goto('/admin-dashboard-su/secure-entry');
  const csp = response?.headers()['content-security-policy'];
  expect(csp).toContain("'nonce-");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  expect(response?.headers()['x-powered-by']).toBeUndefined();
  await expect(page.getByRole('heading', { name: 'Entrada do operador' })).toBeVisible();
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar senha' }).click();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('type', 'password');
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => { localStorage.setItem('nexos-theme', 'light'); window.dispatchEvent(new Event('nexos-theme-change')); });
  await expect(page.locator('html')).not.toHaveClass(/dark/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/login-mobile-light.png', fullPage: true });
  expect(violations).toEqual([]);
});

test('legacy auth routes permanently redirect to the new opaque routes', async ({ request }) => {
  const user = await request.get('/entrar', { maxRedirects: 0 });
  expect(user.status()).toBe(308);
  expect(user.headers().location).toContain('/portal/acesso');
  const admin = await request.get('/login', { maxRedirects: 0 });
  expect(admin.status()).toBe(308);
  expect(admin.headers().location).toContain('/admin-dashboard-su/secure-entry');
});

test('private dashboard redirects and public requests cannot authorize themselves', async ({ page, request }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/admin-dashboard-su\/secure-entry$/);
  const csrf = await request.post('/api/auth/login', { headers: { Origin: 'https://attacker.example' }, data: { email: 'test@example.com', password: 'test' } });
  expect(csrf.status()).toBe(403);
  const admin = await request.get('/api/cloudflare/verify');
  expect([401, 403, 503]).toContain(admin.status());
  const webhook = await request.post('/api/webhooks/checkout', { data: { event: 'PAYMENT_RECEIVED' } });
  expect(webhook.status()).toBe(401);
  const payment = await request.post('/api/checkout/status', { data: { externalReference: 'nexos-test', statusToken: 'forged' } });
  expect(payment.status()).toBe(403);
});

test('checkout rejects anonymous purchase attempts with a login callback', async ({ request }) => {
  const checkout = await request.post('/api/checkout', {
    headers: { Origin: 'http://localhost:3100', 'Idempotency-Key': '00000000-0000-4000-8000-000000000099' },
    data: { productId: 'teste', name: 'Cliente Teste', email: 'anon@example.com', cpfCnpj: '12345678901' },
  });
  expect(checkout.status()).toBe(401);
  const body = await checkout.json();
  expect(body.callbackUrl).toContain('/portal/acesso');
});

test('MFA enrollment and code errors render accessibly (UI contract)', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({ json: { enrollmentRequired: true } }));
  await page.route('**/api/auth/enroll', route => route.fulfill({ json: { factorId: '00000000-0000-4000-8000-000000000001' } }));
  await page.route('**/api/auth/verify', route => route.fulfill({ status: 400, json: { error: 'Código inválido ou expirado. Tente novamente.' } }));
  await page.goto('/admin-dashboard-su/secure-entry');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar autenticador' }).click();
  await page.getByLabel('Código do autenticador').fill('123456');
  await page.getByRole('button', { name: 'Confirmar acesso' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('Código inválido ou expirado. Tente novamente.');
});

test('customer signup enforces password strength and mobile layout (UI contract)', async ({ page }) => {
  await page.route('**/api/auth/user-signup', route => route.fulfill({ json: { message: 'Confira seu e-mail para confirmar a conta.' } }));
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('a-unique-long-passphrase');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('another-long-passphrase');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText('As senhas precisam ser iguais.');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('a-unique-long-passphrase');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('12+ caracteres');
  await page.getByLabel('Senha', { exact: true }).fill('Strong-Passw0rd!xyz');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Strong-Passw0rd!xyz');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Confira seu e-mail' })).toHaveText('Confira seu e-mail para confirmar a conta.');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/customer-mobile.png', fullPage: true });
});

test('social login buttons render on both auth screens and OAuth API fails closed', async ({ page, request }) => {
  await page.goto('/portal/acesso');
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible();
  await page.goto('/admin-dashboard-su/secure-entry');
  await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible();

  const csrf = await request.post('/api/auth/user-oauth', { headers: { Origin: 'https://attacker.example' }, data: { provider: 'google' } });
  expect(csrf.status()).toBe(403);
  const badProvider = await request.post('/api/auth/user-oauth', { headers: { Origin: 'http://localhost:3100' }, data: { provider: 'facebook' } });
  expect(badProvider.status()).toBe(400);
  const oauth = await request.post('/api/auth/user-oauth', { headers: { Origin: 'http://localhost:3100' }, data: { provider: 'google', callbackUrl: '/checkout' } });
  expect(oauth.status()).toBe(200);
  const body = await oauth.json();
  expect(body.url).toContain('authorize');
  expect(body.url).toContain('provider=google');
  expect(body.url).toContain('checkout');
  expect(body.url).not.toContain('http%3A%2F%2Fevil');
  const github = await request.post('/api/auth/oauth', { headers: { Origin: 'http://localhost:3100' }, data: { provider: 'github' } });
  expect(github.status()).toBe(200);
  expect((await github.json()).url).toContain('provider=github');
});

test('customer APIs and callbacks fail closed', async ({ page, request }) => {
  await page.goto('/conta');
  await expect(page).toHaveURL(/\/portal\/acesso$/);
  const csrf = await request.post('/api/auth/user-login', { headers: { Origin: 'https://attacker.example' }, data: {} });
  expect(csrf.status()).toBe(403);
  const malformed = await request.post('/api/auth/user-login', { headers: { Origin: 'http://localhost:3100' }, data: '{' });
  expect(malformed.status()).toBe(400);
  const oversized = await request.post('/api/auth/user-login', { headers: { Origin: 'http://localhost:3100' }, data: 'x'.repeat(9000) });
  expect(oversized.status()).toBe(413);
  const callback = await request.get('/auth/callback?next=https://attacker.example', { maxRedirects: 0 });
  expect(callback.status()).toBe(303);
  expect(callback.headers().location).toBe('http://localhost:3100/portal/acesso?confirmation=error');
  const evilEntry = await request.get('/auth/callback?entry=//evil.example&next=javascript:alert(1)', { maxRedirects: 0 });
  expect(evilEntry.status()).toBe(303);
  expect(evilEntry.headers().location).toBe('http://localhost:3100/portal/acesso?confirmation=error');
  const weak = await request.post('/api/auth/user-signup', { headers: { Origin: 'http://localhost:3100' }, data: { email: 'weak@example.com', password: 'aaaaaaaaaaaaaaa' } });
  expect(weak.status()).toBe(400);
  expect((await weak.json()).error).toContain('12+ caracteres');
});

test('forgot-password UI contract and recovery APIs fail closed', async ({ page, request }) => {
  await page.route('**/api/auth/user-forgot', route => route.fulfill({
    json: { message: 'Se houver uma conta ativa para este e-mail, você receberá um link para redefinir a senha. O link expira em pouco tempo — confira também o spam.' },
  }));
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Esqueceu a senha?', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill('reset@example.com');
  await page.getByRole('button', { name: 'Enviar link de redefinição', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Se houver uma conta ativa' })).toContainText('redefinir a senha');
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();

  await page.goto('/admin-dashboard-su/secure-entry');
  await expect(page.getByRole('button', { name: 'Esqueceu a senha?', exact: true })).toBeVisible();

  const csrf = await request.post('/api/auth/user-forgot', {
    headers: { Origin: 'https://attacker.example' },
    data: { email: 'a@b.co' },
  });
  expect(csrf.status()).toBe(403);
  const invalid = await request.post('/api/auth/user-forgot', {
    headers: { Origin: 'http://localhost:3100' },
    data: { email: 'not-an-email' },
  });
  expect(invalid.status()).toBe(400);
  const invalidReset = await request.post('/api/auth/user-reset', {
    headers: { Origin: 'http://localhost:3100' },
    data: { password: 'weakpassword' },
  });
  expect([400, 401]).toContain(invalidReset.status());
  const redefinir = await page.goto('/portal/redefinir');
  expect(redefinir?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: /Link inválido ou expirado|Defina nova senha/i })).toBeVisible();
});
