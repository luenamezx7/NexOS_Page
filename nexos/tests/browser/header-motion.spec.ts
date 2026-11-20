import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/auth/get-session**', route => route.fulfill({ json: {
    session: { id: 'ui-session', userId: 'ui-user', expiresAt: new Date(Date.now() + 3600000).toISOString() },
    user: { id: 'ui-user', name: 'Visitante de teste', email: 'ui@example.com', emailVerified: true },
  } }));
});

for (const name of ['Selecionar idioma: Português', 'Abrir opções da conta']) {
  test(`header keeps ${name} mounted for its complete exit`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#hero');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const trigger = page.getByRole('banner').getByRole('button', { name, exact: true });
    const popup = page.locator('[data-slot="dropdown-menu-content"]');
    for (let repeat = 0; repeat < 2; repeat++) {
      await trigger.click();
      await expect(popup).toHaveCSS('opacity', '1');
      const exit = await popup.evaluate(element => {
        // Close through the same keyboard handler, then sample before unmount.
        element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        return new Promise<{ retained: boolean; running: boolean; duration: string }>(resolve => requestAnimationFrame(() => {
          resolve({ retained: element.isConnected, running: element.getAnimations().some(animation => animation.playState === 'running'), duration: getComputedStyle(element).transitionDuration });
        }));
      });
      expect(exit.retained).toBe(true);
      expect(exit.running).toBe(true);
      expect(exit.duration).toBe('0.22s');
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
    }
  });
}

for (const width of [390, 820, 1199]) {
  test(`opening the menu keeps page and header geometry at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#hero');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('header [data-account-state="authenticated"]')).toBeAttached();
    const geometry = () => page.evaluate(() => ({
      body: document.body.getBoundingClientRect().width,
      hero: document.querySelector('.hero-container')!.getBoundingClientRect().width,
      header: document.querySelector('header')!.getBoundingClientRect().width,
      documentWidth: document.documentElement.clientWidth,
      padding: getComputedStyle(document.body).paddingRight,
    }));
    for (let repeat = 0; repeat < 2; repeat++) {
      const before = await geometry();
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      const panel = page.locator('#mobile-navigation .t-panel-slide');
      await expect(panel).toHaveCSS('opacity', '1');
      expect(await geometry()).toEqual(before);
      const sizes = await panel.evaluate(async element => {
        const sizes: number[] = [];
        for (let i = 0; i < 8; i++) {
          await new Promise<void>(resolve => requestAnimationFrame(() => { sizes.push(element.getBoundingClientRect().width); resolve(); }));
        }
        return sizes;
      });
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThan(1);
      await page.keyboard.press('Escape');
      await expect(page.locator('#mobile-navigation')).not.toBeVisible();
      expect(await geometry()).toEqual(before);
    }
  });
}

test('resolving a guest session does not resize the open mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/auth/get-session**', async route => { await pending; await route.fulfill({ json: null }); });
  await page.goto('/#hero');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const panel = page.locator('#mobile-navigation .t-panel-slide');
  await expect(panel).toHaveCSS('opacity', '1');
  await expect(panel.locator('[data-account-state="loading"]')).toBeVisible();
  const before = await panel.boundingBox();
  release();
  await expect(panel.locator('[data-account-state="guest"]')).toBeVisible();
  const after = await panel.boundingBox();
  expect(after!.width).toBeCloseTo(before!.width, 0);
  expect(after!.height).toBeCloseTo(before!.height, 0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).not.toBeVisible();
});
