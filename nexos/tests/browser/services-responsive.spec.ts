import { expect, test } from '@playwright/test';

for (const locale of ['pt', 'en', 'es']) {
  test(`${locale}: digital destinations stay within the viewport at responsive breakpoints`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('easyway-language', language);
      sessionStorage.setItem('nexos-boot-seen', '1');
    }, locale);
    await page.goto('/#services');
    for (const width of [320, 390, 768, 1024, 1279, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const section = page.locator('#services');
      await expect(section).toBeVisible();
      const bounds = await section.locator('article, [class*="menuPreview"], [class*="sitePreview"], [class*="serviceCaption"]').evaluateAll(elements => elements.map(el => {
        const { left, right } = el.getBoundingClientRect();
        return { left, right, scrollWidth: el.scrollWidth, clientWidth: el.clientWidth };
      }));
      for (const { left, right, scrollWidth, clientWidth } of bounds) {
        expect(left).toBeGreaterThanOrEqual(-1);
        expect(right).toBeLessThanOrEqual(width + 1);
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
  });
}
