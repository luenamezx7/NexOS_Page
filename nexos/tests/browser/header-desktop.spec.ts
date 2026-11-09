import { expect, test } from '@playwright/test';

test('desktop navigation and account actions never overlap in any language', async ({ page }) => {
  for (const width of [1200, 1280, 1366, 1440, 1920]) {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const header = page.locator('header[data-header-state="assembled"]');
    await expect(header.locator('[data-account-state="guest"]')).toBeVisible();

    for (const language of ['pt', 'en', 'es'] as const) {
      if (language !== 'pt') {
        await header.getByRole('button', { name: /idioma|language|idioma/i }).click();
        await page.getByRole('menuitem', { name: language === 'en' ? 'English' : 'Español' }).click();
      }

      const layout = await header.evaluate(element => {
        const nav = element.querySelector('nav')!;
        const actions = nav.nextElementSibling!;
        const brand = element.querySelector('a')!;
        const rect = (node: Element) => node.getBoundingClientRect();
        return {
          brandRight: rect(brand).right,
          navLeft: rect(nav).left,
          navRight: rect(nav).right,
          actionsLeft: rect(actions).left,
          actionsRight: rect(actions).right,
          headerRight: rect(element).right,
          navFits: [...nav.querySelectorAll('a, button')].every(link => rect(link).left >= rect(nav).left - 1 && rect(link).right <= rect(nav).right + 1),
        };
      });
      expect(layout.brandRight, `${width}px ${language}: brand and navigation`).toBeLessThanOrEqual(layout.navLeft);
      expect(layout.navFits, `${width}px ${language}: navigation fits its column`).toBe(true);
      expect(layout.navRight, `${width}px ${language}: navigation and account actions`).toBeLessThanOrEqual(layout.actionsLeft);
      expect(layout.actionsRight, `${width}px ${language}: actions fit the header`).toBeLessThanOrEqual(layout.headerRight);
    }
  }
});
