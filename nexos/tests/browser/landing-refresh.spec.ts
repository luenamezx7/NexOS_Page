import { expect, test } from '@playwright/test';

async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
}

for (const width of [320, 390]) {
  test(`${width}px: highlighted titles remain readable and the story scrolls`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openHome(page);
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', /Seu negócio conectado em uma aproximação/);
    const logo = page.getByRole('banner').locator('[class*="lockup"]');
    const mascot = await logo.locator('img').boundingBox();
    const lettering = await logo.locator('[data-wordmark]').boundingBox();
    expect(Math.abs(mascot!.y + mascot!.height / 2 - lettering!.y - lettering!.height / 2)).toBeLessThan(5);
    await expect(page.locator('#plans')).toHaveCount(0);
    const heading = page.locator('#showcase-title [data-highlight-ink]');
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible();
    expect(await heading.evaluate(element => getComputedStyle(element).backgroundImage)).toContain('gradient');
    await expect(page.locator('#services [data-services-step]')).toHaveCount(3);
    await expect(page.locator('#services [data-services-step]').first().getByRole('img', { name: 'Cardápio ilustrativo de cafeteria' })).toHaveCount(1);
    const next = page.locator('#mascot-solutions button[aria-label="Próximo cartão"]');
    await next.scrollIntoViewIfNeeded();
    await next.click();
    await expect(page.locator('#mascot-solutions [aria-live]')).toContainText('02 / 04');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('guest header opens signup directly', async ({ page }) => {
  await openHome(page);
  const signup = page.getByRole('banner').getByRole('link', { name: 'Criar conta' });
  await expect(signup).toHaveAttribute('href', '/portal/acesso?mode=signup');
  await signup.click();
  await expect(page).toHaveURL(/\/portal\/acesso\?mode=signup/);
  await expect(page.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible();
});

test('plate hover lights its backdrop without filtering the QR code', async ({ page }) => {
  await openHome(page);
  const plate = page.locator('#showcase [data-plate-option]').first();
  await plate.locator('button').hover();
  await expect.poll(() => plate.locator('[data-plate-face]').evaluate(element => getComputedStyle(element, '::before').opacity)).toBe('1');
  await expect(plate.locator('[data-demo-qr]')).toHaveCSS('filter', 'none');
});

test('reduced motion keeps a complete hero word and all three destinations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await expect(page.locator('[data-typing-word]')).toHaveText('conectado');
  await expect(page.locator('#services [data-services-step] [class*="mobileVisual"]')).toHaveCount(3);
  await expect(page.locator('#services [data-services-step]')).toHaveCount(3);
});
