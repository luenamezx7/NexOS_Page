import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
});

test('mobile usa atmosfera estática e não carrega a fonte do rodapé no início', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  try {
    await page.goto('http://localhost:3100/');
    await expect(page.locator('.night-sky canvas')).toHaveAttribute('data-motion', 'static');
    await expect(page.locator('.hero-veil canvas')).toHaveCount(0);
    await expect(page.locator('[data-dither-wave]')).toHaveCount(0);
    expect(requests.some(url => url.includes('LastoriaBoldRegular.otf'))).toBe(false);
    await page.getByRole('button', { name: 'Ativar modo claro' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    await expect(page.locator('[data-dither-wave]')).toHaveCount(0);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect.poll(() => requests.some(url => url.includes('LastoriaBoldRegular.otf'))).toBe(true);
  } finally {
    await context.close();
  }
});

test('prefers-reduced-motion mantém os efeitos opcionais desativados no desktop', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1365, height: 768 }, colorScheme: 'dark' });
  const page = await context.newPage();
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  try {
    await page.goto('http://localhost:3100/');
    await expect(page.locator('.night-sky canvas')).toHaveAttribute('data-motion', 'static');
    await expect(page.locator('.hero-veil canvas')).toHaveCount(0);
    await expect(page.locator('h1')).toBeVisible();
  } finally {
    await context.close();
  }
});

test('captcha só carrega perto do contato e o envio continua bloqueado sem verificação', async ({ page }) => {
  let widgetRequests = 0;
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: true, configured: true, siteKey: 'test-public-key' } }));
  await page.route('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit', route => {
    widgetRequests += 1;
    return route.fulfill({ contentType: 'application/javascript', body: 'window.turnstile={render:function(el){el.textContent="Widget de teste";return "test-widget";},remove:function(){}};' });
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Enviar projeto', exact: true })).toBeDisabled();
  expect(widgetRequests).toBe(0);
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await expect(page.getByText('Widget de teste', { exact: true })).toBeVisible();
  expect(widgetRequests).toBe(1);
  await expect(page.getByRole('button', { name: 'Enviar projeto', exact: true })).toBeDisabled();
});

test('CTA principal funciona sem JavaScript e favicon SVG é servido corretamente', async ({ browser, request }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3100/');
    const action = page.getByRole('link', { name: 'Iniciar Projeto', exact: true });
    await expect(action).toHaveAttribute('href', '#services');
    await action.click();
    await expect(page).toHaveURL(/#services$/);
    const icon = await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href');
    expect(icon).toContain('/icon.svg');
    const response = await request.get(icon!);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/svg+xml');
  } finally {
    await context.close();
  }
});

test('FAQ da home funciona sem JavaScript e mantém uma resposta aberta por vez', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://localhost:3100/');
    const items = page.locator('#faq details');
    await expect(items).toHaveCount(7);
    await expect(page.locator('#faq details[open]')).toHaveCount(1);
    const second = items.nth(1);
    await second.locator('summary').click();
    await expect(second.locator('p')).toBeVisible();
    await expect(items.first()).not.toHaveAttribute('open');
    await expect(page.locator('#faq details[open]')).toHaveCount(1);
  } finally {
    await context.close();
  }
});

test('header público não consulta sessão durante a carga inicial', async ({ page }) => {
  const sessionRequests: string[] = [];
  page.on('request', request => { if (request.url().includes('/api/auth/session')) sessionRequests.push(request.url()); });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Minha conta', exact: true })).toHaveAttribute('href', '/portal/acesso');
  expect(sessionRequests).toEqual([]);
});

test('contato preserva o mailto e publica a exceção de transformação do Cloudflare', async ({ request, page }) => {
  const response = await request.get('/');
  const html = await response.text();
  expect(html).toContain('<!--email_off-->');
  expect(html).toContain('<!--/email_off-->');
  await page.goto('/');
  await expect(page.locator('#contact a[href^="mailto:"]')).toHaveAttribute('href', 'mailto:nexosperformance@gmail.com');
});
