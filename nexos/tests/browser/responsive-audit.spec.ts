import { expect, test, type Locator } from '@playwright/test';

test('hero keeps the avatar while glass and rotating text are removed', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-hero-glass], #hero-glass-refraction, [data-hero-solution-popups]')).toHaveCount(0);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await page.locator('#hero').evaluate(element => {
      const avatar = element.querySelector('[data-avatar-figure]')!.getBoundingClientRect();
      return { avatarWidth: avatar.width, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(geometry.avatarWidth).toBe(Math.min(width - 48, 360));
    expect(geometry.overflow).toBe(false);
  }
  expect(errors).toEqual([]);
});

async function reachable(control: Locator) {
  await control.scrollIntoViewIfNeeded();
  await expect(control).toBeVisible();
  expect(await control.evaluate(element => {
    const r = element.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight && element.contains(document.elementFromPoint(x, y));
  })).toBe(true);
}

for (const viewport of [{ width: 320, height: 240 }, { width: 320, height: 480 }, { width: 667, height: 320 }, { width: 844, height: 390 }]) {
  test(`cookie choices remain reachable at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/portal/acesso', { waitUntil: 'domcontentloaded' });
    const banner = page.getByRole('dialog', { name: 'Aviso de cookies' });
    await expect(banner).toBeVisible();
    await page.waitForTimeout(600);
    for (const button of await banner.locator('button').all()) await reachable(button);
    await banner.getByRole('button', { name: 'Personalizar', exact: true }).click();
    const preferences = page.getByRole('dialog', { name: 'Preferências de cookies' });
    await expect(preferences).toBeVisible();
    await page.waitForTimeout(600);
    for (const button of await preferences.locator('button').all()) await reachable(button);
    await preferences.getByRole('button', { name: 'Salvar escolhas' }).focus();
    await page.keyboard.press('Tab');
    expect(await preferences.evaluate(element => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(preferences).not.toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('internal navigation survives component breakpoints and 200% CSS zoom', async ({ page }) => {
  await page.goto('/criacao-de-sites', { waitUntil: 'domcontentloaded' });
  for (const width of [320, 600, 767, 768, 820, 1024, 1099, 1100, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    const navigation = page.locator('.page-header-nav');
    await expect(navigation).toBeVisible();
    for (const link of await navigation.getByRole('link').all()) {
      expect(await link.evaluate(element => { const r = element.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })).toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.evaluate(() => { document.documentElement.style.zoom = '2'; });
  await expect(page.locator('.page-header-nav')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
