import { expect, test } from '@playwright/test';

test('o tema escuro é único mesmo com preferência antiga clara ou sistema claro', async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem('nexos-theme', 'light'); sessionStorage.setItem('nexos-boot-seen', '1'); });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  for (const route of ['/', '/criacao-de-sites', '/portal/acesso', '/termos']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('button', { name: /Ativar modo (claro|escuro)/ })).toHaveCount(0);
    const palette = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return { background: style.getPropertyValue('--color-canvas').trim(), surface: style.getPropertyValue('--surface-raised').trim(), border: style.getPropertyValue('--surface-line').trim(), text: style.getPropertyValue('--text-secondary').trim(), lime: style.getPropertyValue('--detail-accent').trim(), scheme: style.colorScheme };
    });
    expect(palette).toEqual({ background: '#07050d', surface: '#170c2b', border: '#2a1d45', text: '#e2d8f5', lime: '#d6f55b', scheme: 'dark only' });
  }
});
