import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('the rendered Figma asset keeps its lilac, magenta and deep violet bands', async ({ page }) => {
  await page.goto('/');
  const colors = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/gradiente-ezway.avif';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 450;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0, 720, 450);
    const pixel = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data).slice(0, 3);
    return { lilac: pixel(360, 8), magenta: pixel(360, 50), violet: pixel(360, 90), black: pixel(360, 380) };
  });
  expect(colors.lilac[0]).toBeGreaterThan(170);
  expect(colors.magenta[2]).toBeGreaterThan(190);
  expect(colors.magenta[1]).toBeLessThan(90);
  expect(colors.violet[0]).toBeLessThan(colors.magenta[0]);
  expect(colors.black.every(channel => channel < 10)).toBe(true);
});

for (const theme of ['light', 'dark']) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: fibers layer over the static fallback without obscuring the hero`, async ({ page, request }) => {
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
      await expect(background).toHaveCSS('background-size', '100% 100%');
      await expect(hero.locator('.hero-fibers canvas')).toBeVisible();
      await expect(hero.locator('.hero-fibers')).not.toHaveCSS('pointer-events', 'none');
      await expect(hero.getByRole('link', { name: 'Agendar conversa' })).toBeVisible();
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
