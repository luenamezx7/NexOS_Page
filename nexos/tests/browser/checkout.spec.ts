import { test, expect, type Page } from '@playwright/test';

const reference = 'nexos-browser-order';
const payment = { paymentUrl: 'https://sandbox.asaas.com/i/browser-order', paymentId: 'pay_browser_order', externalReference: reference, statusToken: 'browser-status-token', amount: 6990, currency: 'brl', billingType: 'CREDIT_CARD', installments: 1, bankSlipUrl: null, identificationField: null };
const order = { productId: 'placa', quantity: 1, amount: 6990, status: 'processing', externalReference: reference };

async function setup(page: Page, theme: 'dark' | 'light' = 'dark', authenticated = true) {
  await page.addInitScript(theme => {
    localStorage.setItem('nexos-theme', theme); sessionStorage.setItem('nexos-boot-seen', '1');
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, theme);
  await page.route('**/api/auth/session', route => route.fulfill({ status: authenticated ? 200 : 401, json: authenticated ? { ok: true, email: 'payer@example.test', role: 'customer' } : { ok: false } }));
  await page.route('**/api/account/profile', route => route.fulfill({ json: { fullName: 'Cliente NexOS' } }));
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/checkout', route => route.request().method() === 'GET' ? route.fulfill({ json: { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } }) : route.fulfill({ json: payment }));
  await page.route('**/api/checkout/installments?**', route => route.fulfill({ json: { installments: [{ installment: 1, value: 69.9, total: 69.9 }, { installment: 2, value: 34.95, total: 69.9 }] } }));
  await page.route('**/api/checkout/order', route => route.fulfill({ status: 404, json: { error: 'Not found' } }));
  await page.route('**/api/checkout/status', route => route.fulfill({ json: { paid: false, status: 'PENDING' } }));
}
async function review(page: Page) {
  await expect(page.getByLabel('Nome completo', { exact: true })).toBeVisible();
  await page.getByLabel('Nome completo', { exact: true }).fill('Cliente NexOS');
  await page.getByLabel('E-mail para o recibo').fill('payer@example.test');
  await page.getByLabel('CPF ou CNPJ').fill('12345678909');
  await page.getByRole('button', { name: 'Revisar e continuar' }).click();
  await expect(page.getByRole('heading', { name: 'Como você quer pagar?' })).toBeVisible();
}

test('landing purchase links and legacy callbacks lead to the dedicated checkout with quantity', async ({ page }) => {
  await setup(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Aumentar quantidade', exact: true }).click();
  await page.getByRole('link', { name: 'Comprar placa', exact: true }).click();
  await expect(page).toHaveURL(/\/checkout\?product=placa&quantity=2/);
  await expect(page.getByTestId('checkout-total')).toHaveText(/139,80/);
  await page.goto('/?checkout=placa&quantity=3');
  await expect(page).toHaveURL(/\/checkout\?product=placa&quantity=3/);
});

test('anonymous checkout shows the order first and preserves the login destination without collecting payer data', async ({ page }) => {
  await setup(page, 'light', false);
  await page.goto('/checkout?product=placa&quantity=3');
  await expect(page.getByRole('heading', { name: 'Seu pedido, na sua conta.' })).toBeVisible();
  expect(new URL((await page.getByRole('link', { name: 'Entrar ou criar conta' }).getAttribute('href'))!, 'http://localhost:3100').searchParams.get('callbackUrl')).toBe('/checkout?product=placa&quantity=3');
  await expect(page.getByLabel('CPF ou CNPJ')).toHaveCount(0);
  await expect(page.getByTestId('checkout-total')).toHaveText(/209,70/);
});

test('review preserves fields on back, exposes installment totals, masks the document and creates one charge', async ({ page }) => {
  await setup(page);
  const creates: { headers: Record<string, string>; body: Record<string, unknown> }[] = [];
  await page.route('**/api/checkout', async route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } });
    creates.push({ headers: route.request().headers(), body: route.request().postDataJSON() });
    await new Promise(resolve => setTimeout(resolve, 250)); return route.fulfill({ json: payment });
  });
  await page.goto('/checkout?product=placa&quantity=1');
  await review(page);
  await expect(page.getByRole('radio', { name: /Pix/ })).toBeDisabled();
  await expect(page.getByLabel('Parcelas')).toContainText('total R$');
  await page.getByRole('button', { name: 'Editar dados' }).click();
  await expect(page.getByLabel('CPF ou CNPJ')).toHaveValue('123.456.789-09');
  await review(page);
  await page.getByRole('button', { name: 'Continuar com pagamento' }).dblclick();
  await expect(page.getByRole('heading', { name: 'Cobrança pronta.' })).toBeVisible();
  expect(creates).toHaveLength(1);
  expect(creates[0].body).not.toHaveProperty('amount'); expect(creates[0].body).not.toHaveProperty('price');
  expect(creates[0].headers['idempotency-key']).toMatch(/^[\da-f-]{36}$/i);
  const stored = await page.evaluate(() => Object.values(sessionStorage).join(' '));
  expect(stored).not.toContain('123.456.789'); expect(stored).not.toContain('payer@example.test'); expect(stored).not.toContain('Cliente NexOS');
  await expect(page.getByRole('link', { name: 'Continuar no Asaas' })).toHaveAttribute('href', payment.paymentUrl);
});

test('reload resumes the server-owned charge without issuing another POST', async ({ page }) => {
  await setup(page);
  let creates = 0;
  await page.route('**/api/checkout', route => {
    if (route.request().method() === 'POST') creates++;
    return route.fulfill({ json: route.request().method() === 'GET' ? { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } : payment });
  });
  await page.goto('/checkout?product=placa&quantity=1'); await review(page);
  await page.getByRole('button', { name: 'Continuar com pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Cobrança pronta.' })).toBeVisible();
  await page.route('**/api/checkout/order', route => route.fulfill({ json: { status: 'succeeded', order, payment, credentials: payment } }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Cobrança pronta.' })).toBeVisible();
  expect(creates).toBe(1);
});

test('boleto generates a server charge and exposes its line/PDF without card inputs', async ({ page }) => {
  await setup(page, 'light');
  let body: Record<string, unknown> | null = null;
  const boleto = { ...payment, billingType: 'BOLETO', bankSlipUrl: 'https://sandbox.asaas.com/b/pdf/browser-order', identificationField: '34191090080000000000000000000000000000000000000' };
  await page.route('**/api/checkout', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } });
    body = route.request().postDataJSON(); return route.fulfill({ json: boleto });
  });
  await page.goto('/checkout?product=placa&quantity=1'); await review(page);
  await page.getByRole('radio', { name: 'Boleto', exact: true }).check();
  await page.getByRole('button', { name: 'Gerar boleto' }).click();
  await expect(page.getByRole('heading', { name: 'Cobrança pronta.' })).toBeVisible();
  expect(body).toMatchObject({ billingType: 'BOLETO', installments: 1 });
  await expect(page.getByLabel('Linha digitável do boleto')).toHaveText(boleto.identificationField);
  await expect(page.getByRole('link', { name: 'Abrir boleto' })).toHaveAttribute('href', boleto.bankSlipUrl);
});

test('invalid details never reach payment creation, and unavailable security configuration blocks submission', async ({ page }) => {
  await setup(page);
  let creates = 0;
  await page.route('**/api/checkout', route => {
    if (route.request().method() === 'POST') creates++;
    return route.fulfill({ json: route.request().method() === 'GET' ? { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } : payment });
  });
  await page.route('**/api/security/config', route => route.fulfill({ status: 503, json: {} }));
  await page.goto('/checkout?product=placa&quantity=1');
  await expect(page.getByLabel('CPF ou CNPJ')).toBeVisible();
  await page.getByLabel('Nome completo', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Revisar e continuar' }).click();
  await expect(page.getByLabel('Nome completo', { exact: true })).toBeFocused();
  expect(creates).toBe(0);
  await review(page);
  await expect(page.getByRole('button', { name: 'Continuar com pagamento' })).toBeDisabled();
  await expect(page.getByRole('alert').filter({ hasText: 'Verificação indisponível' })).toBeVisible();
  expect(creates).toBe(0);
});

test('an uncertain creation is reconciled and cannot start a duplicate payment', async ({ page }) => {
  await setup(page);
  let creates = 0;
  await page.route('**/api/checkout', route => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { ok: true, methods: { PIX: false, BOLETO: true, CREDIT_CARD: true } } });
    creates++; return route.fulfill({ status: 409, json: { error: 'Cobrança aguardando conciliação.' } });
  });
  await page.route('**/api/checkout/order', route => route.fulfill({ json: { status: 'unknown', order, payment: null, credentials: null } }));
  await page.goto('/checkout?product=placa&quantity=1'); await review(page);
  await page.getByRole('button', { name: 'Continuar com pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Vamos conferir sua cobrança.' })).toBeVisible();
  await page.getByRole('button', { name: 'Consultar pedido' }).click();
  await expect(page.getByRole('heading', { name: 'Vamos conferir sua cobrança.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar com pagamento' })).toHaveCount(0);
  expect(creates).toBe(1);
});

test('payment confirmation depends on the status API, and success can recover credentials through ownership', async ({ page }) => {
  await setup(page);
  let paid = false;
  await page.route('**/api/checkout/status', route => route.fulfill({ json: { paid, status: paid ? 'CONFIRMED' : 'PENDING' } }));
  await page.goto('/checkout?product=placa&quantity=1'); await review(page);
  await page.getByRole('button', { name: 'Continuar com pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Cobrança pronta.' })).toBeVisible();
  await expect(page).toHaveURL(/\/checkout/);
  paid = true;
  await page.getByRole('button', { name: 'Já paguei, verificar' }).click();
  await expect(page).toHaveURL(/\/sucesso\?externalReference=/);
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.route('**/api/checkout/order', route => route.fulfill({ json: { status: 'succeeded', order, payment, credentials: payment } }));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();
  await page.evaluate(() => sessionStorage.clear());
  await page.goto('/sucesso?paymentId=pay_browser_order');
  await expect(page.getByRole('heading', { name: 'Pagamento confirmado!' })).toBeVisible();
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: order summary, input palette and payment layout fit 320–1440px`, async ({ page }) => {
    await setup(page, theme); await page.goto('/checkout?product=placa&quantity=1');
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Ver detalhes do pedido' }).click();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade do pedido' })).toBeVisible();
    await page.getByRole('button', { name: 'Aumentar quantidade do pedido' }).click();
    await expect(page.getByTestId('checkout-total')).toHaveText(/139,80/);
    await review(page);
    await expect(page.getByRole('radio', { name: 'Boleto', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('owned order recovery is private and rejects cross-site or anonymous requests', async ({ request }) => {
  const body = { externalReference: reference };
  expect((await request.post('/api/checkout/order', { headers: { Origin: 'http://localhost:3100' }, data: body })).status()).toBe(401);
  expect((await request.post('/api/checkout/order', { headers: { Origin: 'https://attacker.example' }, data: body })).status()).toBe(403);
});
