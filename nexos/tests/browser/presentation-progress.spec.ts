import { expect, test } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`mascot stays centered and preserves the opening clock at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(() => {
      const samples: { phase: string; time: number }[] = [];
      Object.assign(window, { presentationSamples: samples });
      new MutationObserver(() => {
        const dialog = document.querySelector('[data-presentation]');
        const phase = dialog?.getAttribute('data-phase') || 'closed';
        if (phase !== samples.at(-1)?.phase) samples.push({ phase, time: performance.now() });
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-phase'] });
    });
    await page.goto('/');
    const dialog = page.locator('[data-presentation]');
    const mascot = dialog.getByRole('img', { name: 'Mascote ezway' });
    await expect(mascot).toBeVisible();
    const timing = await dialog.evaluate(el => {
      const css = getComputedStyle(el);
      return ['--entry-duration', '--entry-fade-duration', '--exit-duration'].map(key => {
        const value = css.getPropertyValue(key).trim();
        return parseFloat(value) * (value.endsWith('ms') ? 1 : 1000);
      });
    });
    expect(timing).toEqual([5000, 700, 1100]);
    const startedAt = await dialog.evaluate(el => window.__ezwayPresentations?.get(el as HTMLDialogElement)?.startedAt);
    const box = await mascot.boundingBox();
    expect(Math.abs(box!.x + box!.width / 2 - width / 2)).toBeLessThan(2);
    expect(Math.abs(box!.y + box!.height / 2 - 450)).toBeLessThan(2);
    await expect(mascot).toHaveAttribute('data-logo-reveal', /playing|complete/);
    await page.screenshot({ path: `/tmp/mascot-opening-${width}.png` });
    await expect(dialog).toHaveCount(0, { timeout: 15000 });
    const samples = await page.evaluate(() => (window as unknown as { presentationSamples: { phase: string; time: number }[] }).presentationSamples);
    const enter = samples.find(s => s.phase === 'entering')!;
    const leave = samples.find(s => s.phase === 'leaving')!;
    const closed = samples.find(s => s.phase === 'closed' && s.time > leave.time)!;
    expect(leave.time - (startedAt ?? enter.time)).toBeGreaterThanOrEqual(4900);
    expect(leave.time - (startedAt ?? enter.time)).toBeLessThan(5600);
    expect(closed.time - leave.time).toBeGreaterThanOrEqual(1000);
    expect(closed.time - leave.time).toBeLessThan(1700);
    await expect(page.locator('#hero')).toBeFocused();
  });
}

for (const failure of ['webgl', 'asset', 'slow-asset']) {
  test(`${failure}: fallback never blocks page release`, async ({ page }) => {
    if (failure === 'webgl') await page.addInitScript(() => {
      Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { value: undefined });
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
        if (args[0] === 'webgl2') return null;
        return original.apply(this, args);
      } as typeof original;
    });
    else await page.route('**/logo-ghost.svg', async route => {
      if (failure === 'slow-asset') await new Promise(resolve => setTimeout(resolve, 4500));
      await route.abort();
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const dialog = page.locator('[data-presentation]');
    await expect(dialog).toHaveCount(0, { timeout: 10000 });
    await expect(page.locator('#hero')).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });
}

test('one canvas completes the reveal and a full eye blink without a visual handoff', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const mascot = page.locator('[data-logo-reveal]');
  const canvas = mascot.locator('[data-logo-canvas]');
  const original = await canvas.elementHandle();
  await expect(mascot).toHaveAttribute('data-logo-reveal', 'complete');
  await expect(canvas).toBeVisible();
  await expect(mascot.locator('[data-logo-fallback]')).toBeHidden();
  await expect(mascot).toHaveAttribute('data-eye-blink', 'closed');
  await page.screenshot({ path: '/tmp/mascot-eyes-closed.png' });
  await expect(mascot).toHaveAttribute('data-eye-blink', 'open');
  expect(await original!.evaluate(el => el.isConnected && getComputedStyle(el).visibility === 'visible')).toBe(true);
  await expect(page.locator('[data-presentation]')).toHaveAttribute('data-phase', 'entering');
  await page.screenshot({ path: '/tmp/mascot-face-after-blink.png' });
});

test('delayed hydration starts native-resolution Silk and glass before React without replay', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/_next/**/*.js*', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  const dialog = page.locator('[data-presentation]');
  const mascot = dialog.locator('[data-logo-reveal]');
  await expect(mascot).toHaveAttribute('data-logo-reveal', 'playing');
  await expect(mascot).toHaveAttribute('data-eye-blink', 'open');
  await expect(dialog).toHaveAttribute('data-phase', 'pending');
  await expect(dialog).toHaveCSS('background-image', 'none');
  const size = await dialog.locator('[data-silk-background]').evaluate(canvas => ({ width: (canvas as HTMLCanvasElement).width, viewport: innerWidth }));
  expect(size.width).toBeGreaterThanOrEqual(size.viewport - 10);
  const start = await dialog.evaluate(el => window.__ezwayPresentations?.get(el as HTMLDialogElement)?.startedAt);
  await expect(dialog).toHaveAttribute('data-phase', 'entering');
  expect(await dialog.evaluate(el => window.__ezwayPresentations?.get(el as HTMLDialogElement)?.startedAt)).toBe(start);
  await page.screenshot({ path: '/tmp/mascot-first-frame.png' });
  await expect(dialog).toHaveCount(0, { timeout: 15000 });
  expect(errors).toEqual([]);
});


test('worker keeps drawing at Retina resolution while React main thread is deliberately blocked', async ({ browser, baseURL }) => {
  const context=await browser.newContext({baseURL,viewport:{width:1440,height:900},deviceScaleFactor:2});
  const page=await context.newPage();
  try {
  await page.goto('/');
  const dialog=page.locator('[data-presentation]');
  const mode=await dialog.evaluate(el => {
    const runtime=window.__ezwayPresentations?.get(el as HTMLDialogElement);
    Object.assign(window,{measuredOpening:runtime});
    return runtime?.mode;
  });
  expect(mode).toBe('worker');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const until=performance.now()+300;
    while(performance.now()<until) { /* Simulate a long hydration task. */ }
  });
  await expect(dialog).toHaveCount(0,{timeout:10000});
  const metrics=await page.evaluate(() => (window as unknown as {measuredOpening:{metrics?:{frames:number;max:number;p95:number}}}).measuredOpening.metrics);
  console.info('Opening worker timing (ms):', metrics);
  expect(metrics).toBeTruthy();
  expect(metrics!.frames).toBeGreaterThan(150);
  expect(metrics!.p95).toBeLessThan(35);
  expect(metrics!.max).toBeLessThan(100);
  } finally { await context.close(); }
});
