import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.goto('/');
  await enterPresentation(page);
  await expect(page.locator('.landing-page')).toHaveAttribute('data-edge-spring', 'ready');
});

test('wheel stretches the top, settles, and leaves ordinary scrolling free', async ({ page }) => {
  const root = page.locator('.landing-page');
  const headerBefore = await page.locator('header[role="banner"]').boundingBox();
  await page.mouse.move(650, 400);
  // Sample in the dispatch frame; a wheel burst releases after 90 ms.
  const pulled = await page.locator('#hero').evaluate(el => {
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -240, bubbles: true, cancelable: true }));
    return { offset: parseFloat(document.querySelector<HTMLElement>('.landing-page')!.style.getPropertyValue('--edge-top')), scroll: scrollY, hero: el.getBoundingClientRect().top, header: document.querySelector('header[role="banner"]')!.getBoundingClientRect().top };
  });
  expect(pulled.offset).toBeGreaterThan(20);
  expect(pulled.scroll).toBeGreaterThan(0);
  expect(pulled.hero).toBeGreaterThan(20);
  expect(pulled.header).toBeCloseTo(headerBefore!.y, 1);
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--edge-top'))).toBe('0px');
  await expect(page.locator('#main-content')).toHaveCSS('translate', 'none');
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  expect(await root.evaluate(el => el.style.getPropertyValue('--edge-top'))).toBe('0px');
});

test('bottom rests at half a white logo and reveals more only when pulled', async ({ page }, testInfo) => {
  const root = page.locator('.landing-page');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator('#brand-closing h2');
  await expect(logo).toHaveCSS('-webkit-text-fill-color', 'rgb(255, 255, 255)');
  const before = await logo.boundingBox();
  const height = await page.evaluate(() => innerHeight);
  expect((height - before!.y) / before!.height).toBeCloseTo(.68, 1);
  const max = await page.evaluate(() => document.documentElement.scrollHeight);
  const surface = page.locator('[data-edge-surface]');
  const surfaceBefore = await surface.boundingBox();
  await page.screenshot({ path: testInfo.outputPath('bottom-rest.png') });
  const headerBefore = await page.locator('header[role="banner"]').boundingBox();
  await page.locator('#brand-closing').dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 650, clientY: 650 }] });
  await page.locator('#brand-closing').dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 650, clientY: 250 }] });
  await expect.poll(() => root.evaluate(el => parseFloat(el.style.getPropertyValue('--edge-bottom')))).toBeGreaterThan(30);
  expect((await logo.boundingBox())!.y).toBeLessThan(before!.y - 20);
  const logoDisplacement = before!.y - (await logo.boundingBox())!.y;
  const surfaceDisplacement = surfaceBefore!.y - (await surface.boundingBox())!.y;
  expect(Math.abs(logoDisplacement - surfaceDisplacement)).toBeLessThan(12);
  const join = await surface.evaluate(el => ({ surface: el.getBoundingClientRect().top, footer: document.querySelector('.footer-transition')!.getBoundingClientRect().bottom }));
  expect(Math.abs(join.surface - join.footer)).toBeLessThan(2);
  expect((await page.locator('header[role="banner"]').boundingBox())!.y).toBeCloseTo(headerBefore!.y, 1);
  await page.screenshot({ path: testInfo.outputPath('bottom-pull.png') });
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeCloseTo(max + height / 2, 0);
  await page.locator('#brand-closing').dispatchEvent('touchend', { touches: [] });
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--edge-bottom'))).toBe('0px');
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(max);
  const after = await logo.boundingBox();
  expect((height - after!.y) / after!.height).toBeCloseTo(.68, 1);
});

test('both extremes stay within half a viewport even with a large pull', async ({ page }) => {
  const root = page.locator('.landing-page');
  await page.locator('#hero').dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 650, clientY: 0 }] });
  await page.locator('#hero').dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 650, clientY: 10000 }] });
  const limit = await page.evaluate(() => innerHeight / 2);
  const top = await root.evaluate(el => parseFloat(el.style.getPropertyValue('--edge-top')));
  expect(top).toBeGreaterThan(limit * .8);
  expect(top).toBeLessThanOrEqual(limit);
  await page.locator('#hero').dispatchEvent('touchend', { touches: [] });
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--edge-top'))).toBe('0px');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.locator('#brand-closing').dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 650, clientY: 10000 }] });
  await page.locator('#brand-closing').dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 650, clientY: 0 }] });
  const bottom = await root.evaluate(el => parseFloat(el.style.getPropertyValue('--edge-bottom')));
  expect(bottom).toBeGreaterThan(limit * .8);
  expect(bottom).toBeLessThanOrEqual(limit);
  const join = await page.locator('[data-edge-surface]').evaluate(el => el.getBoundingClientRect().top - document.querySelector('.footer-transition')!.getBoundingClientRect().bottom);
  expect(Math.abs(join)).toBeLessThan(2);
  await page.locator('#brand-closing').dispatchEvent('touchend', { touches: [] });
});

test.describe('native mobile scrolling', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });

test('touch pulls both boundaries and cancels cleanly', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const root = page.locator('.landing-page');
  const gesture = async (target: string, start: number, end: number) => {
    await page.locator(target).dispatchEvent('touchstart', { touches: [{ identifier: 0, clientX: 180, clientY: start }] });
    await page.locator(target).dispatchEvent('touchmove', { touches: [{ identifier: 0, clientX: 180, clientY: end }] });
  };
  await gesture('#hero', 300, 500);
  await expect.poll(() => root.evaluate(el => parseFloat(el.style.getPropertyValue('--edge-top')))).toBeGreaterThan(20);
  await page.locator('#hero').dispatchEvent('touchcancel', { touches: [] });
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--edge-top'))).toBe('0px');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await gesture('#brand-closing', 650, 450);
  await expect.poll(() => root.evaluate(el => parseFloat(el.style.getPropertyValue('--edge-bottom')))).toBeGreaterThan(20);
  await page.locator('#brand-closing').dispatchEvent('touchend', { touches: [] });
  await expect.poll(() => root.evaluate(el => el.style.getPropertyValue('--edge-bottom'))).toBe('0px');
});

});
