import { test, expect } from '@playwright/test';

test('saved purchase links redirect to commercial and payment APIs are removed', async ({ request }) => {
  const response = await request.get('/checkout?product=placa&quantity=3', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
  const destination = new URL(response.headers().location);
  expect(destination.hostname).toBe('wa.me');
  expect(destination.searchParams.get('text')).toContain('3 Placas Inteligentes NexOS');
  for (const route of ['/api/checkout', '/api/checkout/installments', '/api/checkout/order', '/api/checkout/status', '/api/webhooks/checkout']) {
    expect((await request.get(route)).status()).toBe(404);
    expect((await request.post(route, { data: {} })).status()).toBe(404);
  }
});

test('service detail CTAs lead directly to the commercial team', async ({ page }) => {
  for (const path of ['/placa-nfc', '/criacao-de-sites', '/landing-pages', '/cardapio-digital']) {
    await page.goto(path);
    await expect(page.locator('a[href*="/checkout"]')).toHaveCount(0);
    await expect(page.locator('main')).not.toContainText(/R\$|por mês|por unidade/);
    const action = page.getByRole('link', { name: path === '/placa-nfc' ? 'Adquirir Placa' : 'Falar com o comercial', exact: true }).first();
    await expect(action).toHaveAttribute('href', /^https:\/\/wa.me\//);
  }
});

test('landing offers have no public prices and quantity is sent to commercial', async ({ page }) => {
  await page.goto('/#showcase');
  await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
  await expect(page.locator('main')).not.toContainText(/R\$|por mês|por unidade|desconto aplicado/);
  await expect(page.getByTestId('plate-total')).toHaveCount(0);
  await expect(page.locator('#services')).toContainText('Valores e condições são definidos com o comercial');
  await page.getByRole('button', { name: 'Aumentar quantidade' }).click();
  const href = await page.getByRole('link', { name: 'Adquirir Placa', exact: true }).getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain('2 Placas Inteligentes NexOS');
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: mascot strip remains horizontal and within the viewport`, async ({ page }) => {
    await page.addInitScript(theme => {
      sessionStorage.setItem('nexos-boot-seen', '1');
      localStorage.setItem('nexos-theme', theme);
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    }, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#hero');
    await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
    const strip = page.locator('#mascot-solutions ul');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await strip.scrollIntoViewIfNeeded();
      await expect(strip.locator('li')).toHaveCount(4);
      const positions = await strip.locator('li').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator('#mascot-solutions').screenshot({ path: `test-results/mascot-strip-${theme}.png` });
  });
}
