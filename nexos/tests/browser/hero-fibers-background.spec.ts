import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: only fibers appear behind the hero content`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
      await page.goto('/');
      const intro = page.locator('dialog[data-presentation]');
      if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
      await expect(intro).toHaveCount(0);
      const hero = page.locator('#hero');
      await expect(hero.locator('.hero-gradient-blend')).toHaveCount(0);
      await expect(hero).toHaveCSS('background-image', 'none');
      await expect(hero).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      const fibers = hero.locator('.hero-fibers');
      await expect(fibers.locator('canvas')).toBeVisible();
      await expect(fibers).not.toHaveCSS('pointer-events', 'none');
      await expect(hero.getByRole('link', { name: 'Agendar conversa' })).toBeVisible();
      await expect(hero.locator('h1')).toHaveCSS('color', 'rgb(249, 243, 250)');
      const bounds = await fibers.evaluate(el => {
        const layer = el.getBoundingClientRect();
        const section = el.parentElement!.getBoundingClientRect();
        return { layer: { width: layer.width, height: layer.height }, section: { width: section.width, height: section.height } };
      });
      expect(Math.abs(bounds.layer.width - bounds.section.width)).toBeLessThan(2);
      expect(Math.abs(bounds.layer.height - bounds.section.height)).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}

test('reduced motion keeps the fibers static without restoring the gradient', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  await expect(page.locator('#hero .hero-fibers canvas')).toBeVisible();
  await expect(page.locator('#hero .hero-gradient-blend')).toHaveCount(0);
});
