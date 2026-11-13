import { expect, test } from '@playwright/test';

async function enter(page: import('@playwright/test').Page) {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  await expect(intro).toBeVisible();
  await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
}

test('limited desktop keeps scrolling and readable content under CPU pressure', async ({ page }) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await enter(page);
  await expect(page.locator('#hero .ghost-fibers-container')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/limited-desktop-hero.png' });
  await page.getByRole('link', { name: 'Conhecer a Placa NFC', exact: true }).click();
  await expect(page).toHaveURL(/#showcase$/);
  await expect(page.locator('#showcase')).toBeInViewport();
  await expect.poll(() => page.evaluate(() => document.querySelectorAll('[data-reveal-state="entering"]').length)).toBe(0);
  await expect(page.locator('#services')).toBeAttached();
  await page.screenshot({ path: 'test-results/limited-desktop.png' });
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('mobile keeps entrance animations; reduced motion remains explicit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await enter(page);
  const pending = page.locator('[data-reveal-state="pending"]').first();
  await expect(pending).toBeAttached();
  const target = await pending.elementHandle();
  await target!.scrollIntoViewIfNeeded();
  await expect.poll(() => target!.getAttribute('data-reveal-state')).toBe('visible');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('[data-reveal-state="pending"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
