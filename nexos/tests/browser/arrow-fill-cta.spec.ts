import { expect, test } from '@playwright/test';

const heroCTA = '#hero a[data-arrow-fill-button]';

for (const width of [320, 390, 768, 1440]) {
  test(`commercial fill CTAs fit at ${width}px and preserve contact context`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('[data-arrow-fill-button]')).toHaveCount(2);
    await expect(page.locator('#gestao [data-arrow-fill-button]')).toHaveCount(1);
    const hero = page.locator(heroCTA);
    await expect(hero).toHaveAccessibleName('Conversar sobre meu negócio');
    const href = new URL((await hero.getAttribute('href'))!);
    expect(href.hostname).toBe('wa.me');
    expect(href.searchParams.get('text')).toContain('entender qual solução faz sentido');
    expect(await page.locator('[data-arrow-fill-button]').evaluateAll(elements => elements.every(element => {
      const box = element.getBoundingClientRect();
      return !box.height || (box.height >= 44 && box.left >= -1 && box.right <= innerWidth + 1);
    }))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('fill expands on hover and keyboard focus with only one accessible label', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const cta = page.locator(heroCTA);
  await expect(cta).toHaveAttribute('data-ready', 'true');
  const fill = cta.locator(':scope > span').nth(1);
  expect((await fill.boundingBox())!.width).toBeLessThan(50);
  await cta.hover();
  await expect.poll(async () => Math.abs((await fill.boundingBox())!.width - (await cta.boundingBox())!.width)).toBeLessThan(3);
  await page.mouse.move(0, 0);
  await cta.focus();
  await expect(cta).toBeFocused();
  await expect(cta).toHaveCSS('outline-style', 'solid');
  await expect(cta).toHaveAccessibleName('Conversar sobre meu negócio');
});

test('touch press fills the CTA and releases cleanly', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const cta = page.locator(heroCTA);
  await cta.dispatchEvent('pointerdown', { pointerType: 'touch' });
  await expect(cta).toHaveAttribute('data-pressed', 'true');
  await cta.dispatchEvent('pointercancel', { pointerType: 'touch' });
  await expect(cta).toHaveAttribute('data-pressed', 'false');
  await context.close();
});

test('CTA stays visible without JavaScript and respects reduced motion', async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJs = await context.newPage();
  await noJs.goto('/');
  await expect(noJs.locator(heroCTA)).toBeVisible();
  await expect(noJs.locator(heroCTA)).toHaveAttribute('href', /wa.me/);
  await context.close();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator(heroCTA)).toBeVisible();
  await expect(page.locator(heroCTA).locator(':scope > span').nth(1)).toHaveCSS('transition-duration', '0s');
});

test('service pages keep their standard commercial CTAs', async ({ page }) => {
  for (const route of ['/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/placa-nfc']) {
    await page.goto(route);
    await expect(page.locator('[data-arrow-fill-button]')).toHaveCount(0);
    const cta = page.locator('main a.btn-primary-nex').first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /wa.me/);
    await expect(cta).toHaveAttribute('target', '_blank');
  }
});
