import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

for (const profile of [
  { name: 'weak desktop', touch: false, cpu: 6, embedded: false },
  { name: 'weak mobile', touch: true, cpu: 4, embedded: false },
  { name: 'Instagram mobile browser', touch: true, cpu: 4, embedded: true },
]) {
  test(`${profile.name}: smooth input, inertia and idle engine`, async ({ browser, baseURL }) => {
    test.setTimeout(120000);
    const context = await browser.newContext({ baseURL, hasTouch: profile.touch, isMobile: profile.touch, viewport: profile.touch ? { width: 390, height: 844 } : { width: 1280, height: 800 }, reducedMotion: 'reduce', ...(profile.embedded ? { userAgent: 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36 Instagram' } : {}) });
    await context.addInitScript(() => {
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => 1 });
      Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 1 });
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await page.goto('/');
    await enterPresentation(page);
    await expect(page.locator('html')).toHaveAttribute('data-scroll-engine', 'smooth');
    await page.evaluate(() => document.fonts.ready);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    const samplesPromise = page.evaluate(() => new Promise<number[]>(resolve => {
      const samples: number[] = [];
      const start = performance.now();
      const sample = () => {
        samples.push(scrollY);
        if (performance.now() - start > 2800) resolve(samples);
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }));
    if (profile.touch) {
      const x = 190;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: 650 }] });
      for (const y of [610, 570, 530, 490, 450, 410, 370]) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
        await page.waitForTimeout(32);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await page.mouse.move(600, 500);
      await page.mouse.wheel(0, 1000);
    }
    const samples = await samplesPromise;
    expect(new Set(samples.map(Math.round)).size).toBeGreaterThan(5);
    expect(samples.at(-1)!).toBeGreaterThan(profile.touch ? 100 : 600);
    expect(samples.at(-1)!).toBeLessThan(profile.touch ? 2000 : 800);
    for (let i = 1; i < samples.length; i++) expect(samples[i]).toBeGreaterThanOrEqual(samples[i - 1] - 2);
    await expect(page.locator('html')).toHaveAttribute('data-scroll-raf', 'idle', { timeout: 10000 });
    if (profile.touch) {
      await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, 400);
      expect(await page.evaluate(() => scrollY)).toBe(before);
      await page.getByRole('button', { name: 'Fechar menu', exact: true }).click();
    }
    expect(errors).toEqual([]);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await context.close();
  });
}
