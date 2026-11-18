import { expect, test } from '@playwright/test';

interface WaveProbe { draws: number; programs: number }
declare global { interface Window { waveProbe: WaveProbe } }

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    window.waveProbe = { draws: 0, programs: 0 };
    const draw = WebGLRenderingContext.prototype.drawElements;
    WebGLRenderingContext.prototype.drawElements = function (...args) {
      if ((this.canvas as HTMLCanvasElement).hasAttribute('data-gradient-canvas')) window.waveProbe.draws++;
      return draw.apply(this, args);
    };
    const create = WebGLRenderingContext.prototype.createProgram;
    WebGLRenderingContext.prototype.createProgram = function () {
      if ((this.canvas as HTMLCanvasElement).hasAttribute('data-gradient-canvas')) window.waveProbe.programs++;
      return create.call(this);
    };
  });
});

async function openWave(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('#services').evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 180, behavior: 'instant' }));
}

for (const width of [390, 1440]) {
  test(`wave fills the existing MacBook stage, animates and pauses without rebuilding at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await openWave(page);
    const wave = page.locator('#services [data-gradient-wave]');
    await expect(wave).toHaveAttribute('data-wave-state', 'running');
    await expect(wave).toHaveAttribute('aria-hidden', 'true');
    await expect(wave).toHaveCSS('pointer-events', 'none');
    expect(await wave.evaluate(el => {
      const stage = el.parentElement!;
      const a = el.getBoundingClientRect(), b = stage.getBoundingClientRect();
      const canvas = el.querySelector('canvas')!;
      return { width: Math.abs(a.width - b.width), height: Math.abs(a.height - b.height), pixels: canvas.width * canvas.height, canvasCount: el.querySelectorAll('canvas').length };
    })).toMatchObject({ width: 0, height: 0, canvasCount: 1 });
    expect(await wave.locator('canvas').evaluate(el => (el as HTMLCanvasElement).width * (el as HTMLCanvasElement).height)).toBeLessThanOrEqual(901000);
    const before = await page.evaluate(() => window.waveProbe.draws);
    await expect.poll(() => page.evaluate(() => window.waveProbe.draws)).toBeGreaterThan(before + 3);
    const originalY = await page.evaluate(() => scrollY);
    await page.getByRole('button', { name: 'Ver solução: Landing page', exact: true }).click();
    await expect(page.locator('[data-macbook-slide][data-active="true"]')).toContainText('Uma pausa para o seu dia.');
    expect(await page.evaluate(() => scrollY)).toBe(originalY);
    expect(await page.evaluate(() => window.waveProbe.programs)).toBe(1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(wave).toHaveAttribute('data-wave-state', 'running');
    const stopped = await page.evaluate(() => window.waveProbe.draws);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.waveProbe.draws)).toBeGreaterThan(stopped);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#services').evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + 180, behavior: 'instant' }));
    await expect(wave).toHaveAttribute('data-wave-state', 'running');
    expect(await page.evaluate(() => window.waveProbe.programs)).toBe(1);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect(wave).toHaveAttribute('data-wave-state', 'paused');
    const paused = await page.evaluate(() => window.waveProbe.draws);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.waveProbe.draws)).toBe(paused);
    expect(errors).toEqual([]);
  });
}

test('CSS gradient remains usable when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: object) {
      if (this.hasAttribute('data-gradient-canvas') && kind === 'webgl') return null;
      return Reflect.apply(getContext, this, [kind, options]);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openWave(page);
  const wave = page.locator('[data-gradient-wave]');
  await expect(wave).toHaveAttribute('data-wave-state', 'fallback');
  await expect(wave).not.toHaveCSS('background-image', 'none');
  await expect(wave.locator('canvas')).toHaveCSS('opacity', '0');
  await page.getByRole('button', { name: 'Ver solução: Landing page', exact: true }).click();
  await expect(page.locator('[data-macbook-slide][data-active="true"]')).toContainText('Uma pausa para o seu dia.');
  expect(errors).toEqual([]);
});

test('context loss falls back and restoration recreates a single working scene', async ({ page }) => {
  await openWave(page);
  const wave = page.locator('[data-gradient-wave]');
  await expect(wave).toHaveAttribute('data-wave-state', 'running');
  const loss = await wave.locator('canvas').evaluateHandle(canvas => (canvas as HTMLCanvasElement).getContext('webgl')!.getExtension('WEBGL_lose_context')!);
  await loss.evaluate(extension => extension.loseContext());
  await expect(wave).toHaveAttribute('data-wave-state', 'fallback');
  await loss.evaluate(extension => extension.restoreContext());
  await loss.dispose();
  await expect(wave).toHaveAttribute('data-wave-state', 'running');
  await expect(wave.locator('canvas')).toHaveCount(1);
  const draws = await page.evaluate(() => window.waveProbe.draws);
  await expect.poll(() => page.evaluate(() => window.waveProbe.draws)).toBeGreaterThan(draws + 2);
  expect(await page.evaluate(() => window.waveProbe.programs)).toBe(2);
});
