import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

for (const width of [320, 390]) {
  test(`${width}px: home keeps a quiet hero and moves account access into the menu`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    const intro = page.locator('dialog[data-presentation]');
    if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(intro).toHaveCount(0);

    const header = page.getByRole('banner');
    await expect(header.getByRole('button', { name: 'Switch to English' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Minha conta' })).toBeHidden();
    const hero = page.locator('#hero');
    await expect(hero.locator('.hero-description')).toBeVisible();
    await expect(hero.locator('.hero-description')).toContainText('Sites, landing pages');
    const description = await hero.locator('.hero-description').boundingBox();
    const actions = await hero.locator('.hero-actions').boundingBox();
    expect(description!.y + description!.height).toBeLessThan(actions!.y);
    expect(actions!.y).toBeGreaterThan(844 * 0.5);
    await expect(hero.getByRole('link', { name: 'Agendar conversa' })).toBeVisible();
    await expect(hero.getByRole('link', { name: 'Conhecer a Placa NFC' })).toBeVisible();
    await expect(hero.locator('.hero-easychat-link')).toBeHidden();
    await expect(hero.locator('[data-hero-brand-strip]')).toBeHidden();
    await expect(page.locator('a[class*="floating"]')).toHaveCSS('width', '44px');

    await header.getByRole('button', { name: 'Abrir menu' }).click();
    const menu = page.getByRole('navigation', { name: 'Navegação móvel' });
    await expect(menu).toBeVisible();
    const dialog = page.getByRole('dialog', { name: 'Explore a ezway' });
    expect((await dialog.locator('[class*="mobilePanel"]').boundingBox())!.height).toBeLessThan(560);
    await expect(dialog.getByRole('link', { name: 'Minha conta' })).toHaveAttribute('href', '/portal/acesso');
    const services = menu.locator('details');
    await expect(services).not.toHaveAttribute('open');
    await expect(menu.getByRole('link', { name: 'Sites e Portfólios' })).toBeHidden();
    await services.locator('summary').click();
    await expect(menu.getByRole('link', { name: 'Sites e Portfólios' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await header.getByRole('button', { name: 'Abrir menu' }).click();
    await expect(menu.locator('details')).not.toHaveAttribute('open');
    await page.keyboard.press('Escape');

    await page.locator('#plans').scrollIntoViewIfNeeded();
    await expect(page.locator('#plans h2')).toHaveAttribute('data-reveal-state', 'visible');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await header.getByRole('button', { name: 'Abrir menu' }).click();
    await menu.locator('summary').click();
    await menu.getByRole('link', { name: 'Sites e Portfólios' }).click();
    await expect(page).toHaveURL(/\/criacao-de-sites$/);
  });
}

test('short mobile viewport preserves the headline, subtitle and CTA', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const hero = page.locator('#hero');
  await expect(hero.locator('.hero-fibers')).toHaveCount(0);
  await expect(hero.locator('.hero-description')).toBeVisible();
  const cta = await hero.getByRole('link', { name: 'Agendar conversa' }).boundingBox();
  expect(cta!.y + cta!.height).toBeLessThanOrEqual((await hero.boundingBox())!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
