import { expect, test, type Page } from '@playwright/test';

async function openWord(page: Page) {
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
  await page.locator('[data-avatar-word]').scrollIntoViewIfNeeded();
  return page.locator('[data-bubblegum-shader]');
}

for (const width of [390, 1440]) {
  test(`shader renders only inside the centered word at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const shader = await openWord(page);
    await expect(page.locator('#hero-title')).toHaveText('Conectamos IA ao seu negócio e ampliamos seus resultados');
    await expect(shader).toHaveAttribute('data-shader-state', 'ready');
    await expect(shader).toHaveAttribute('data-shader-playing', 'true');
    const pixels = await shader.evaluate(canvas => new Promise<{ colored: number; pink: number; clear: number; total: number; middleClear: boolean; error: number }>(resolve => {
      const element = canvas as HTMLCanvasElement;
      const gl = element.getContext('webgl')!;
      const original = gl.drawArrays;
      gl.drawArrays = function (...args) {
        original.apply(gl, args);
        const data = new Uint8Array(element.width * element.height * 4);
        gl.readPixels(0, 0, element.width, element.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        let colored = 0, pink = 0, clear = 0, middleClear = true;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] === 0) clear++;
          if (data[i + 3] > 128 && Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]) > 10) {
            colored++;
            if (data[i] >= data[i + 2] && data[i + 2] >= data[i + 1]) pink++;
          }
        }
        for (let y = 0; y < element.height; y++) {
          if (data[(y * element.width + Math.floor(element.width / 2)) * 4 + 3] !== 0) middleClear = false;
        }
        gl.drawArrays = original;
        resolve({ colored, pink, clear, total: element.width * element.height, middleClear, error: gl.getError() });
      };
    }));
    expect(pixels.error).toBe(0);
    expect(pixels.colored).toBeGreaterThan(100);
    expect(pixels.pink / pixels.colored).toBeGreaterThan(.95);
    expect(pixels.clear / pixels.total).toBeGreaterThan(.5);
    expect(pixels.middleClear).toBe(true);
    const frame = Number(await shader.getAttribute('data-shader-frame'));
    await expect.poll(async () => Number(await shader.getAttribute('data-shader-frame'))).toBeGreaterThan(frame + 2);
    await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }));
    await expect(shader).toHaveAttribute('data-shader-playing', 'false');
    const pausedFrame = await shader.getAttribute('data-shader-frame');
    await page.waitForTimeout(200);
    expect(await shader.getAttribute('data-shader-frame')).toBe(pausedFrame);
  });
}

test('reduced motion holds a static shader and lost WebGL contexts recover', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const shader = await openWord(page);
  await expect(shader).toHaveAttribute('data-shader-state', 'ready');
  await expect(shader).toHaveAttribute('data-shader-playing', 'false');
  const frame = await shader.getAttribute('data-shader-frame');
  await page.waitForTimeout(200);
  expect(await shader.getAttribute('data-shader-frame')).toBe(frame);
  await shader.evaluate(canvas => {
    const element = canvas as HTMLCanvasElement & { restoreShaderContext: () => void };
    const extension = element.getContext('webgl')!.getExtension('WEBGL_lose_context')!;
    element.restoreShaderContext = () => extension.restoreContext();
    extension.loseContext();
  });
  await expect(shader).toHaveAttribute('data-shader-state', 'fallback');
  await expect(page.locator('[data-shader-text]').first()).not.toHaveCSS('background-image', 'none');
  await shader.evaluate(canvas => (canvas as HTMLCanvasElement & { restoreShaderContext: () => void }).restoreShaderContext());
  await expect(shader).toHaveAttribute('data-shader-state', 'ready');
});

test('missing WebGL retains the original gradient and readable text', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
        if (this.hasAttribute('data-bubblegum-shader') && type === 'webgl') return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  const shader = await openWord(page);
  await expect(shader).toHaveAttribute('data-shader-state', 'fallback');
  await expect(page.locator('[data-shader-text]').first()).not.toHaveCSS('background-image', 'none');
  await expect(page.locator('[data-avatar-word]')).toHaveAttribute('aria-label', 'Presença');
});
