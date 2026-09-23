import { test, expect } from '@playwright/test';

test('login hydrates with nonce CSP; controls work in desktop and mobile themes', async ({ page }) => {
  const violations: string[] = [];
  page.on('pageerror', error => violations.push(error.message));
  page.on('console', message => { if (/violates.*Content Security Policy|hydration/i.test(message.text())) violations.push(message.text()); });
  const response = await page.goto('/login');
  const csp = response?.headers()['content-security-policy'];
  expect(csp).toContain("'nonce-");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
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

test('private dashboard redirects and public requests cannot authorize themselves', async ({ page, request }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login$/);
  const csrf = await request.post('/api/auth/login', { headers: { Origin: 'https://attacker.example' }, data: { email: 'test@example.com', password: 'test' } });
  expect(csrf.status()).toBe(403);
  const admin = await request.get('/api/cloudflare/verify');
  expect([401, 403, 503]).toContain(admin.status());
  const webhook = await request.post('/api/webhooks/checkout', { data: { event: 'PAYMENT_RECEIVED' } });
  expect(webhook.status()).toBe(401);
  const payment = await request.post('/api/checkout/status', { data: { externalReference: 'nexos-test', statusToken: 'forged' } });
  expect(payment.status()).toBe(403);
});

test('MFA enrollment and code errors render accessibly (UI contract)', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({ json: { enrollmentRequired: true } }));
  await page.route('**/api/auth/enroll', route => route.fulfill({ json: { factorId: '00000000-0000-4000-8000-000000000001' } }));
  await page.route('**/api/auth/verify', route => route.fulfill({ status: 400, json: { error: 'Código inválido ou expirado. Tente novamente.' } }));
  await page.goto('/login');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: 'Configurar autenticador' }).click();
  await page.getByLabel('Código do autenticador').fill('123456');
  await page.getByRole('button', { name: 'Confirmar acesso' }).click();
  await expect(page.getByRole('alert')).toHaveText('Código inválido ou expirado. Tente novamente.');
});
