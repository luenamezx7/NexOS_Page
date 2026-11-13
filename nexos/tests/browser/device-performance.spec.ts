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
  await expect(page.locator('.landing-page')).toHaveAttribute('data-motion-detail', 'light');
  const plates = page.locator('[data-hero-plates]');
  await plates.scrollIntoViewIfNeeded();
  await expect(plates).toHaveAttribute('data-motion-active', 'true');
  const before = await plates.locator(':scope > div').evaluate(element => getComputedStyle(element).transform);
  await expect.poll(() => plates.locator(':scope > div').evaluate(element => getComputedStyle(element).transform)).not.toBe(before);
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

for (const profile of [
  { name: 'limited touch phone', viewport: { width: 360, height: 740 }, hasTouch: true, limited: true },
  { name: 'touch tablet', viewport: { width: 820, height: 1180 }, hasTouch: true, limited: false },
  { name: 'wide desktop', viewport: { width: 1920, height: 1080 }, hasTouch: false, limited: false },
]) {
  test.describe(profile.name, () => {
    test.use({ viewport: profile.viewport, hasTouch: profile.hasTouch });
    test('keeps ambient and scroll motion without WebGL and pauses offscreen', async ({ page }) => {
      test.setTimeout(90000);
      // The commercial motion must survive missing/disabled GPU APIs too.
      await page.addInitScript(({ limited }) => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
          if (type === 'webgl' || type === 'webgl2') return null;
          return Reflect.apply(original, this, [type, ...args]);
        } as typeof original;
        if (limited) {
          Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 2 });
          Object.defineProperty(navigator, 'deviceMemory', { get: () => 2 });
        }
      }, { limited: profile.limited });
      if (profile.limited && page.context().browser()?.browserType().name() === 'chromium') {
        const cdp = await page.context().newCDPSession(page);
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
      }
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await enter(page);
      const plates = page.locator('[data-hero-plates]');
      await plates.scrollIntoViewIfNeeded();
      await expect(plates).toHaveAttribute('data-motion-active', 'true');
      const group = plates.locator(':scope > div');
      await expect(group).toHaveCSS('animation-play-state', 'running');
      const first = await group.evaluate(element => getComputedStyle(element).transform);
      await expect.poll(() => group.evaluate(element => getComputedStyle(element).transform)).not.toBe(first);

      const grid = page.locator('[data-plate-grid]');
      await grid.scrollIntoViewIfNeeded();
      await expect(grid).toHaveAttribute('data-motion-active', 'true');
      const face = grid.locator('[data-plate-face]').first();
      await expect(face).toHaveCSS('animation-play-state', 'running');
      const translate = await face.evaluate(element => getComputedStyle(element).translate);
      await expect.poll(() => face.evaluate(element => getComputedStyle(element).translate)).not.toBe(translate);

      const phone = page.locator('[data-phone-scroll]');
      await phone.scrollIntoViewIfNeeded();
      await expect(grid).toHaveAttribute('data-motion-active', 'false');
      await expect(face).toHaveCSS('animation-play-state', 'paused');
      await expect(plates).toHaveAttribute('data-motion-active', 'false');
      await expect(group).toHaveCSS('animation-play-state', 'paused');
      await expect.poll(() => phone.evaluate(element => element.style.transform || element.style.top)).not.toBe('');
      const readPosition = () => phone.evaluate(element => getComputedStyle(element).transform + getComputedStyle(element).top);
      const start = await readPosition();
      await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'instant' }));
      await expect.poll(readPosition).not.toBe(start);
      await expect(page.locator('#easychat [data-message-visible="true"]').first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/motion-${profile.name.replaceAll(' ', '-')}.png` });

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await plates.scrollIntoViewIfNeeded();
      await expect(group).toHaveCSS('animation-name', 'none');
      await expect(face).toHaveCSS('animation-name', 'none');
      await expect.poll(() => phone.evaluate(element => element.style.transform || element.style.top)).toBe('');
      expect(errors).toEqual([]);
    });
  });
}

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
