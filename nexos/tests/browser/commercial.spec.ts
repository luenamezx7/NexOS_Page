import { test, expect } from '@playwright/test';

test('obsolete checkout pages and payment APIs are absent', async ({ request }) => {
  for (const route of ['/checkout', '/sucesso', '/cancelado', '/api/checkout', '/api/checkout/installments', '/api/checkout/order', '/api/checkout/status', '/api/webhooks/checkout', '/api/account/orders', '/api/account/addresses']) {
    expect((await request.get(route)).status()).toBe(404);
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

test('landing offers have no public prices and the chosen use is sent to commercial', async ({ page }) => {
  await page.goto('/#showcase');
  const presentation = page.locator('dialog[data-presentation]');
  if (await presentation.isVisible()) await presentation.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(page.locator('main')).not.toContainText(/R\$|por mês|por unidade|desconto aplicado/);
  await expect(page.getByTestId('plate-total')).toHaveCount(0);
  await expect(page.locator('#services')).toContainText('Escopo, valores e condições são alinhados com o comercial');
  await expect(page.getByRole('group', { name: 'Quantidade de placas' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Ver placa Instagram' }).click();
  const href = await page.locator('#showcase').getByRole('link', { name: 'Entender mais', exact: true }).first().getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain('Instagram');
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: mascot image carousel and captions stay within the viewport`, async ({ page }) => {
    await page.addInitScript(theme => {
      sessionStorage.setItem('nexos-boot-seen', '1');
      localStorage.setItem('nexos-theme', theme);
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    }, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/#hero');
    await expect(page.getByRole('dialog', { name: 'Apresentação ezway' })).toHaveCount(0);
    const carousel = page.getByRole('region', { name: 'Suportes e soluções ezway', exact: true });
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await carousel.scrollIntoViewIfNeeded();
      await expect(carousel).toBeVisible();
      await expect(carousel.locator('li')).toHaveCount(4);
      await expect(carousel.locator('figcaption')).toHaveCount(4);
      const bounds = await carousel.boundingBox();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width);
      const positions = await carousel.locator('li').evaluateAll(items => items.map(item => item.getBoundingClientRect().top));
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.locator('#mascot-solutions').screenshot({ path: `test-results/mascot-strip-${theme}.png` });
  });
}
