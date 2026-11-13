import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const width of [390, 1366]) {
  test(`a linha verde acompanha o progresso e recua ao subir em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/criacao-de-sites');
    const progress = page.locator('[data-scroll-progress]');
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
    await expect(progress.locator('div')).toHaveCSS('background-color', 'rgb(34, 197, 94)');
    await expect(progress).toHaveText('');
    const scrollTo = async (fraction: number) => {
      await page.evaluate(fraction => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * fraction, behavior: 'instant' }), fraction);
      await expect.poll(() => progress.getAttribute('aria-valuenow')).toBe(String(Math.round(fraction * 100)));
      const scale = await progress.locator('div').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
      expect(Math.abs(scale - fraction)).toBeLessThan(.01);
    };
    await scrollTo(.5);
    await scrollTo(1);
    await scrollTo(.25);
    await scrollTo(0);
  });
}

test('a barra branca aparece na navegação entre páginas e não nos links da própria página', async ({ page }) => {
  await page.goto('/criacao-de-sites');
  const indicator = page.locator('[data-route-loading]');
  await expect(indicator).toHaveAttribute('data-route-loading', 'idle');

  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await expect(page).toHaveURL(/#como-funciona$/);
  await expect(indicator).toHaveAttribute('data-route-loading', 'idle');

  await page.evaluate(() => {
    const indicator = document.querySelector('[data-route-loading]');
    if (!indicator) return;
    const states: string[] = [];
    const observer = new MutationObserver(() => {
      const state = indicator.getAttribute('data-route-loading');
      if (state) states.push(state);
    });
    observer.observe(indicator, { attributes: true, attributeFilter: ['data-route-loading'] });
    Object.assign(window, { routeLoadingStates: states });
  });

  await page.getByRole('banner').getByRole('link', { name: 'Placa NFC', exact: true }).click();
  await expect(page).toHaveURL(/\/placa-nfc$/);
  await expect(indicator).toHaveAttribute('data-route-loading', 'idle');
  expect(await page.evaluate(() => (window as Window & { routeLoadingStates?: string[] }).routeLoadingStates)).toContain('complete');
  await expect(indicator.locator('span')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});
