import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: Figma artwork replaces the hero shader and keeps text readable`, async ({ page, request }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
      const asset = await request.get('/gradiente-ezway.avif');
      expect(asset.ok()).toBe(true);
      expect(asset.headers()['content-type']).toContain('image/avif');
      await page.goto('/');
      const dialog = page.locator('dialog[data-presentation]');
      if (await dialog.isVisible()) await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
      await expect(dialog).toHaveCount(0);
      const hero = page.locator('#hero');
      const background = hero.locator('.hero-gradient-blend');
      await expect(background).toHaveCSS('background-image', /gradiente-ezway\.avif/);
      await expect(background).toHaveCSS('background-size', 'cover');
      await expect(hero.locator('[data-brand-veil], .grainient-container')).toHaveCount(0);
      await expect(hero).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect(hero.locator('h1')).toHaveCSS('color', 'rgb(249, 243, 250)');
      await expect(hero.locator('[data-reveal-word="Soluções"], [data-reveal-word="AI-powered"]').first()).toHaveCSS('text-shadow', 'none');
      const bounds = await background.evaluate(el => {
        const image = el.getBoundingClientRect();
        const section = el.parentElement!.getBoundingClientRect();
        return { image: { width: image.width, height: image.height }, section: { width: section.width, height: section.height } };
      });
      expect(Math.abs(bounds.image.width - bounds.section.width), JSON.stringify(bounds)).toBeLessThan(2);
      expect(Math.abs(bounds.image.height - bounds.section.height), JSON.stringify(bounds)).toBeLessThan(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
