import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

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
