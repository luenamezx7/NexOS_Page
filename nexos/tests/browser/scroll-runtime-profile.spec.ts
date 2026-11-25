import { dismissPresentation } from './helpers/presentation';
import { test, expect } from '@playwright/test';

test('scroll runtime profile preserves full motion', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'Chrome DevTools runtime metrics');
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  const initial = await cdp.send('Performance.getMetrics');
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toBeVisible();
  await dismissPresentation(page);
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0);
  await expect(page.locator('[data-heading-scroll="ready"]').first()).toBeAttached();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
  const before = await cdp.send('Performance.getMetrics');
  const frames = await page.evaluate(async () => {
    const intervals: number[] = [];
    let last = performance.now();
    for (let i = 0; i < 240; i++) {
      await new Promise<void>(resolve => requestAnimationFrame(now => {
        intervals.push(now - last); last = now;
        scrollTo({ top: i * 50, behavior: 'instant' }); resolve();
      }));
    }
    return intervals;
  });
  const after = await cdp.send('Performance.getMetrics');
  const metrics = Object.fromEntries(after.metrics.filter(m => ['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'].includes(m.name)).map(m => [m.name, m.value - (before.metrics.find(b => b.name === m.name)?.value ?? 0)]));
  const startup = Object.fromEntries(before.metrics.filter(m => ['LayoutCount', 'RecalcStyleCount', 'LayoutDuration', 'RecalcStyleDuration', 'ScriptDuration', 'TaskDuration'].includes(m.name)).map(m => [m.name, m.value - (initial.metrics.find(b => b.name === m.name)?.value ?? 0)]));
  const sorted = frames.slice(5).sort((a,b) => a-b);
  const result = { metrics, startup, frameP95: sorted[Math.floor(sorted.length * .95)], framesOver33ms: sorted.filter(v => v > 33.4).length };
  console.log(JSON.stringify(result));
  await testInfo.attach('runtime-metrics', { body: JSON.stringify(result, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: testInfo.outputPath('scroll.png') });
  await expect(page.locator('.landing-page')).toHaveAttribute('data-motion-detail', 'full');
  const progress = page.locator('[data-scroll-progress]');
  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await expect(progress).toHaveAttribute('aria-valuenow', '100');
    await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await expect(progress).toHaveAttribute('aria-valuenow', '0');
  }
  expect(errors).toEqual([]);
});
