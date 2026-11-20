import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

for (const width of [390, 1366]) {
  test(`MacBook holds, blends and reverses without moving the chassis at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    await enterPresentation(page);
    const root = page.locator('#services');
    await expect(root).toHaveAttribute('data-screen-transition', 'ready');
    const chassis = root.locator('[data-macbook-chassis]');
    const originalTransform = await chassis.evaluate(el => getComputedStyle(el).transform);
    const slides = root.locator('[data-macbook-slide]');
    const opacity = (index: number) => slides.nth(index).evaluate(el => Number(getComputedStyle(el).opacity));
    const place = (progress: number) => root.evaluate((el, progress) => {
      const stage = el.querySelector<HTMLElement>('[data-services-journey]')!;
      scrollTo({ top: scrollY + el.getBoundingClientRect().top + (el.clientHeight - stage.offsetHeight) * progress, behavior: 'instant' });
    }, progress);
    await place(.07);
    await expect.poll(() => opacity(0)).toBeCloseTo(1, 2);
    await expect.poll(() => opacity(1)).toBeLessThan(.01);
    const before = await chassis.boundingBox();
    await place(.24);
    await expect.poll(() => opacity(1)).toBeGreaterThan(.55);
    expect(await opacity(1)).toBeLessThan(.8);
    expect(await opacity(0)).toBeGreaterThan(.2);
    expect(await opacity(0)).toBeLessThan(.45);
    expect(await chassis.evaluate(el => getComputedStyle(el).transform)).toBe(originalTransform);
    expect((await chassis.boundingBox())!.width).toBeCloseTo(before!.width, 1);
    await place(1);
    await expect(slides.nth(3)).toHaveAttribute('data-active', 'true');
    await expect.poll(() => opacity(3)).toBeGreaterThan(.99);
    await place(0);
    await expect(slides.first()).toHaveAttribute('data-active', 'true');
    await expect.poll(() => opacity(1)).toBeLessThan(.01);
    await root.getByRole('button', { name: 'Ver solução: Landing page' }).click();
    await expect(slides.nth(3)).toHaveAttribute('data-active', 'true');
    await expect.poll(() => opacity(3)).toBeGreaterThan(.99);
    expect(await chassis.evaluate(el => getComputedStyle(el).transform)).toBe(originalTransform);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await chassis.screenshot({ path: testInfo.outputPath(`macbook-transition-${width}.png`) });
  });
}
