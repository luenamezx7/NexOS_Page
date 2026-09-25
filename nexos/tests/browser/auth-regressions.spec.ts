import { test, expect, type Page } from '@playwright/test';

async function mockCaptcha(page: Page) {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: true, configured: true, siteKey: 'test-public-key' } }));
  await page.addInitScript(() => {
    let sequence = 0;
    Object.assign(window, { turnstile: {
      render: (_element: HTMLElement, options: { callback: (token: string) => void }) => {
        const token = `test-token-${++sequence}`;
        queueMicrotask(() => options.callback(token));
        return token;
      },
      remove: () => {}, reset: () => {},
    } });
  });
}

test('www preserves callback path and query', async ({ request }) => {
  const response = await request.get('/portal/acesso?callbackUrl=%2Fconta', { headers: { Host: 'www.nexoslab.online' }, maxRedirects: 0 });
  expect(response.status()).toBe(308);
  expect(response.headers().location).toBe('https://nexoslab.online/portal/acesso?callbackUrl=%2Fconta');
});

test('OTP resend obtains a fresh captcha while code verification stays available', async ({ page }) => {
  await mockCaptcha(page);
  const tokens: string[] = [];
  await page.route('**/api/auth/user-otp', route => {
    tokens.push(route.request().postDataJSON().captcha);
    return route.fulfill({ json: { message: 'Confira seu e-mail.' } });
  });
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Entrar com código por e-mail' }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.com');
  await page.getByRole('button', { name: 'Enviar código por e-mail' }).click();
  await expect(page.getByRole('button', { name: 'Verificar código', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Reenviar código', exact: true }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens[0]).toBeTruthy();
  expect(tokens[1]).not.toBe(tokens[0]);
});

test('contact retries with a new captcha and preserves message after failure', async ({ page }) => {
  await mockCaptcha(page);
  const tokens: string[] = [];
  await page.route('**/api/contact', route => {
    tokens.push(route.request().postDataJSON().turnstileToken);
    return route.fulfill(tokens.length === 1
      ? { status: 502, json: { error: 'Serviço temporariamente indisponível.' } }
      : { json: { ok: true } });
  });
  await page.goto('/?checkout=unknown');
  await page.locator('#contact-name').fill('Cliente Teste');
  await page.locator('#contact-email').fill('customer@example.com');
  await page.locator('#contact-message').fill('Quero conversar sobre um projeto.');
  await page.getByRole('button', { name: 'Enviar projeto' }).click();
  await expect(page.getByText('Serviço temporariamente indisponível.')).toBeVisible();
  await expect(page.locator('#contact-message')).toHaveValue('Quero conversar sobre um projeto.');
  await page.getByRole('button', { name: 'Enviar projeto' }).click();
  await expect.poll(() => tokens.length).toBe(2);
  expect(tokens[0]).toBeTruthy();
  expect(tokens[1]).not.toBe(tokens[0]);
});

test('login resumes selected product and quantity without creating a payment', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  let signedIn = false;
  await page.route('**/api/auth/session', route => route.fulfill(signedIn
    ? { json: { ok: true, email: 'customer@example.com' } }
    : { status: 401, json: { ok: false } }));
  await page.route('**/api/auth/user-login', route => {
    signedIn = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.goto('/?checkout=placa&quantity=3');
  await expect(page).toHaveURL(/\/portal\/acesso\?callbackUrl=/);
  await page.getByLabel('E-mail', { exact: true }).fill('customer@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('Strong-Passw0rd!xyz');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/checkout=placa&quantity=3/);
  await expect(page.getByRole('dialog', { name: 'Placa Inteligente NFC + QR' })).toBeVisible();
  await expect(page.locator('#checkout-email')).toHaveValue('customer@example.com');
});

test('repeated callback parameters do not crash either login page', async ({ page }) => {
  for (const entry of ['/portal/acesso', '/admin-dashboard-su/secure-entry']) {
    const response = await page.goto(`${entry}?callbackUrl=/conta&callbackUrl=/dashboard`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  }
});

test('cancelled OAuth preserves the purchase destination and displays a fixed error', async ({ request }) => {
  const destination = '/?checkout=placa&quantity=3#services';
  const response = await request.get(`/auth/callback?error=access_denied&entry=/portal/acesso&next=${encodeURIComponent(destination)}`, { maxRedirects: 0 });
  expect(response.status()).toBe(303);
  const location = new URL(response.headers().location);
  expect(location.pathname).toBe('/portal/acesso');
  expect(location.searchParams.get('callbackUrl')).toBe(destination);
  expect(location.searchParams.get('confirmation')).toBe('error');
  expect(response.headers()['cache-control']).toContain('no-store');
});

test('unavailable security config blocks password login but leaves social login available', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/portal/acesso');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Verificação indisponível');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Google', exact: true })).toBeEnabled();
});

test('checkout retries session verification before exposing payment controls', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  let requests = 0;
  await page.route('**/api/auth/session', route => route.fulfill(++requests === 1
    ? { status: 503, json: {} }
    : { json: { ok: true, email: 'customer@example.com' } }));
  await page.goto('/?checkout=placa&quantity=3');
  const checkout = page.getByRole('dialog', { name: 'Placa Inteligente NFC + QR' });
  await expect(checkout.getByRole('alert')).toContainText('Não foi possível verificar sua sessão');
  await expect(page.locator('#checkout-email')).toHaveCount(0);
  await checkout.getByRole('button', { name: 'Tentar verificar sessão novamente' }).click();
  await expect(page.locator('#checkout-email')).toHaveValue('customer@example.com');
  expect(requests).toBe(2);
});

test('payment method and installments stay bound to the generated charge', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/auth/session', route => route.fulfill({ json: { ok: true, email: 'customer@example.com' } }));
  await page.route('**/api/checkout/installments?*', route => route.fulfill({ json: { installments: [
    { installment: 1, value: 209.7, total: 209.7 }, { installment: 3, value: 69.9, total: 209.7 },
  ] } }));
  await page.route('**/api/checkout/status', route => route.fulfill({ json: { paid: false } }));
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/checkout', async route => {
    await held;
    await route.fulfill({ json: { paymentUrl: 'https://www.asaas.com/i/test', paymentId: 'test-payment', externalReference: 'test-reference', statusToken: 'test-token' } });
  });
  await page.goto('/?checkout=placa&quantity=3');
  await page.locator('#checkout-name').fill('Cliente Teste');
  await page.locator('#checkout-cpf').fill('12345678901');
  await page.locator('#checkout-installments').selectOption('3');
  const checkout = page.getByRole('dialog', { name: 'Placa Inteligente NFC + QR' });
  await checkout.getByRole('button', { name: /^Pagar R\$/ }).click();
  try {
    await expect(checkout.getByRole('button', { name: 'Boleto', exact: true })).toBeDisabled();
    await expect(page.locator('#checkout-installments')).toBeDisabled();
  } finally { release(); }
  await expect(checkout.getByRole('link', { name: 'Pagar com cartão no Asaas' })).toBeVisible();
  await expect(checkout.getByRole('button', { name: 'Boleto', exact: true })).toBeDisabled();
  await checkout.getByRole('button', { name: 'Gerar nova cobrança' }).click();
  await checkout.getByRole('button', { name: 'Boleto', exact: true }).click();
  await checkout.getByRole('button', { name: 'Cartão', exact: true }).click();
  await expect(page.locator('#checkout-installments')).toHaveValue('1');
});
