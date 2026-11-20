import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

test('desktop controls and portalled menus share glass while language selection works', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#hero');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const header = page.getByRole('banner');
  const language = header.getByRole('button', { name: 'Selecionar idioma: Português' });
  await language.click();
  const panel = page.locator('[role="menu"][data-navigation-glass="panel"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.navigation-glass')).toHaveAttribute('data-glass-variant', 'panel');
  await expect(panel).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await page.keyboard.press('Escape');
  await expect(language).toBeFocused();
  await language.click();
  await expect(panel).toBeVisible();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(header.getByRole('button', { name: 'Select language: English' })).toBeFocused();
});

for (const width of [320, 390, 768]) {
  test(`mobile glass panel fits and returns focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/#hero');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Explore a ezway' });
    await expect(dialog).toBeVisible();
    const panel = dialog.locator('[data-navigation-glass="panel"]');
    expect(await panel.evaluate(el => { const r = el.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })).toBe(true);
    await expect(dialog.getByRole('button', { name: 'Serviços', exact: true })).toHaveCount(0);
    await expect(dialog.getByRole('link', { name: 'Gestão', exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
  });
}
