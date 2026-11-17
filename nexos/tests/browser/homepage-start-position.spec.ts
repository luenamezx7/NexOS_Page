import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  for (const reduced of [false, true]) {
    test(`home starts at the hero after a scrolled reload at ${width}px, reduced=${reduced}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await page.goto('/');
      await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
      await expect.poll(() => page.evaluate(() => history.scrollRestoration)).toBe('manual');
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
      await page.evaluate(() => scrollTo({ top: 2500, behavior: 'instant' }));
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(2000);
      await page.reload();
      await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
      await expect(page.locator('#hero')).toBeFocused();
      await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(2);
      // Catch a late browser/animation restoration after the intro releases scroll.
      await page.waitForTimeout(800);
      expect(await page.evaluate(() => scrollY)).toBeLessThan(2);
      await page.locator('#hero .hero-secondary-action').click();
      await expect(page).toHaveURL(/#ecossistema$/);
      await expect(page.locator('#ecossistema')).toBeFocused();
    });
  }

  test(`explicit management deep link survives loading at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#gestao');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect.poll(() => page.locator('#gestao').evaluate(section => Math.abs(section.getBoundingClientRect().top - 110))).toBeLessThan(4);
    await page.reload();
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect.poll(() => page.locator('#gestao').evaluate(section => Math.abs(section.getBoundingClientRect().top - 110))).toBeLessThan(4);
  });
}
