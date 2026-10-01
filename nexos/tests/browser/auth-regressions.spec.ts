import { test, expect, type Page } from '@playwright/test';

async function mockCaptcha(page: Page) {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: true, configured: true, siteKey: 'test-public-key' } }));
  await page.addInitScript(() => {
    let sequence = 0;
    Object.assign(window, { turnstile: {
      render: (_element: HTMLElement, options: { callback: (token: string) => void }) => {
        const token = `test-token-${++sequence}`; queueMicrotask(() => options.callback(token)); return token;
      }, remove: () => {}, reset: () => {},
    } });
  });
}

test('www preserves callback path and query', async ({ request }) => {
  const response = await request.get('/portal/acesso?callbackUrl=%2Fconta', { headers: { Host: 'www.nexoslab.online' }, maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('https://nexoslab.online/portal/acesso?callbackUrl=%2Fconta');
});

test('signup and verification resend use fresh CAPTCHA headers', async ({ page }) => {
  await mockCaptcha(page);
  const tokens: string[] = [];
  for (const endpoint of ['sign-up/email', 'send-verification-email']) {
    await page.route(`**/api/auth/${endpoint}`, route => {
      tokens.push(route.request().headers()['x-captcha-response']);
      return route.fulfill({ json: { status: true, user: { email: 'customer@example.test' } } });
    });
  }
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Cliente Teste');
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByRole('button', { name: 'Reenviar e-mail de confirmação' }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens[0]).toBeTruthy(); expect(tokens[1]).not.toBe(tokens[0]);
});

test('repeated callback parameters do not crash either login page', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  for (const entry of ['/portal/acesso', '/admin-dashboard-su/secure-entry']) {
    expect((await page.goto(`${entry}?callbackUrl=/conta&callbackUrl=/dashboard`))?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  }
});

test('cancelled OAuth preserves the destination and displays an error', async ({ page }) => {
  let callback = '';
  await page.route('**/api/auth/sign-in/social', route => {
    callback = route.request().postDataJSON().errorCallbackURL;
    return route.fulfill({ status: 400, json: { code: 'OAUTH_FAILED' } });
  });
  await page.goto('/portal/acesso?callbackUrl=%2F%3Fcheckout%3Dplaca%26quantity%3D3');
  await page.getByRole('button', { name: 'GitHub', exact: true }).click();
  expect(new URL(callback, 'http://localhost:3100').searchParams.get('callbackUrl')).toBe('/?checkout=placa&quantity=3');
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível iniciar' })).toBeVisible();
});

test('unavailable CAPTCHA config blocks password login but leaves social available', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/portal/acesso');
  await expect(page.locator('[data-slot="alert"]')).toContainText('Verificação indisponível');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'GitHub', exact: true })).toBeEnabled();
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
