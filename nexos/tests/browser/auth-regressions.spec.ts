import { test, expect } from '@playwright/test';

test('www preserves callback path and query', async ({ request }) => {
  const response = await request.get('/portal/acesso?callbackUrl=%2Fconta', { headers: { Host: 'www.nexoslab.online' }, maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('https://nexoslab.online/portal/acesso?callbackUrl=%2Fconta');
});

test('public registration and social options stay absent, including the old signup URL', async ({ page }) => {
  for (const url of ['/portal/acesso', '/portal/acesso?mode=signup', '/admin-dashboard-su/secure-entry']) {
    await page.goto(url);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Criar.*conta|Google|GitHub/i })).toHaveCount(0);
    await expect(page.getByRole('link', { name: /Criar.*conta/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Esqueceu a senha?' })).toBeVisible();
  }
});

test('repeated callback parameters do not crash either login page', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  for (const entry of ['/portal/acesso', '/admin-dashboard-su/secure-entry']) {
    expect((await page.goto(`${entry}?callbackUrl=/conta&callbackUrl=/dashboard`))?.status()).toBe(200);
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  }
});

test('unavailable CAPTCHA config blocks password login', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/portal/acesso');
  await expect(page.locator('[data-slot="alert"]')).toContainText('Verificação indisponível');
  await expect(page.locator('button[type="submit"]')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'GitHub', exact: true })).toHaveCount(0);
});

test('reset validates token errors and does not require a session', async ({ page }) => {
  await page.route('**/api/auth/reset-password', route => route.fulfill({ status: 400, json: { code: 'INVALID_TOKEN', message: 'Invalid token' } }));
  await page.goto('/portal/redefinir?token=test-expired-token');
  await page.getByLabel('Nova senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'expirou ou já foi usado' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar nova senha' })).toBeEnabled();
});

test('anonymous APIs and internal email worker fail closed', async ({ request }) => {
  expect((await request.get('/api/account/profile')).status()).toBe(401);
  expect((await request.get('/api/internal/email-outbox')).status()).toBe(401);
  expect((await request.post('/api/account/profile', { headers: { Origin: 'https://attacker.example' }, data: {} })).status()).toBe(403);
});
