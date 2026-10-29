import { expect, test } from '@playwright/test';

const routes = ['/placa-nfc', '/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/privacidade', '/termos', '/cookies', '/lgpd', '/reembolso', '/portal/acesso', '/portal/redefinir', '/admin-dashboard-su/secure-entry', '/pagina-inexistente-nexos'];

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: internal pages share brand chrome and fit the viewport`, async ({ page }, testInfo) => {
      test.setTimeout(90000);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(theme => {
        localStorage.setItem('nexos-theme', theme);
        localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      }, theme);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const route of routes) {
        const response = await page.goto(route);
        expect(response?.status(), route).toBe(route.includes('inexistente') ? 404 : 200);
        await expect(page.locator('[data-page-header]'), route).toBeVisible();
        await expect(page.locator('h1'), route).toHaveCount(1);
        await expect(page.locator('h1'), route).toBeVisible();
        await expect(page.getByRole('button', { name: theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro' }), route).toBeVisible();
        await expect(page.locator('.interior-atmosphere'), route).toHaveCount(1);
        await expect(page.locator('.interior-atmosphere .brand-veil-light'), route).toHaveCSS('background-image', /radial-gradient/);
        await expect(page.locator('.interior-atmosphere canvas'), route).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), route).toBe(true);
        const headerBounds = await page.locator('[data-page-header]').boundingBox();
        expect(headerBounds!.x, route).toBeGreaterThanOrEqual(0);
        expect(headerBounds!.x + headerBounds!.width, route).toBeLessThanOrEqual(width);
        if (['/privacidade', '/criacao-de-sites', '/portal/acesso', '/pagina-inexistente-nexos'].includes(route)) {
          await page.screenshot({ path: testInfo.outputPath(`${route.slice(1)}-${theme}-${width}.png`) });
        }
      }
      expect(errors).toEqual([]);
    });
  }
}

test('internal links preserve theme and legal navigation exposes the active document', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'light'));
  await page.goto('/privacidade');
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await page.getByRole('navigation', { name: 'Documentos legais' }).getByRole('link', { name: 'Termos', exact: true }).click();
  await expect(page).toHaveURL(/\/termos$/);
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect(page.getByRole('navigation', { name: 'Documentos legais' }).locator('[aria-current="page"]')).toHaveText('Termos');
  await expect(page.locator('h1')).toBeVisible();
});
