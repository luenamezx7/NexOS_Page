import { expect, test, type Page } from '@playwright/test';

const phrase = 'Nexos, a performance que seu business merece.';

// Software WebGL in CI can take longer to compile the owner's full fragment shader.
test.setTimeout(90000);

async function monitorDraws(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { configurable: true, value: undefined });
    Object.assign(window, { __wavesDraws: 0 });
    const original = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (mode, first, count) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.hasAttribute('data-waves-background')) {
        const state = window as unknown as { __wavesDraws: number };
        state.__wavesDraws++;
      }
      return original.call(this, mode, first, count);
    };
  });
}

async function drawCount(page: Page) {
  return page.evaluate(() => (window as unknown as { __wavesDraws: number }).__wavesDraws);
}

test('primeira visita apresenta Waves, o texto exato e uma entrada direta na home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await monitorDraws(page);
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading')).toHaveText(phrase);
  const button = dialog.getByRole('button', { name: 'Continuar para o site' });
  await expect(button).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(button).toBeFocused();
  const canvas = dialog.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
  await expect(page.locator('.night-sky canvas')).toHaveAttribute('data-motion', 'static');
  await expect(page.locator('.hero-veil canvas')).toHaveCount(0);
  const stars = dialog.locator('.waves-entry-stars canvas');
  await expect(stars).toHaveAttribute('data-motion', 'animated');
  const whiteStars = await stars.evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    let white = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i] > 240 && pixels[i + 1] > 240 && pixels[i + 2] > 240 && pixels[i + 3] > 30) white++;
    }
    return white;
  });
  expect(whiteStars).toBeGreaterThan(100);
  const recipe = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl')!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    const uniform = (name: string) => Array.from(gl.getUniform(program, gl.getUniformLocation(program, name)!) as Float32Array);
    return {
      webgl1: gl instanceof WebGLRenderingContext,
      shape: uniform('u_shape'), surface: uniform('u_surface'), finish: uniform('u_finish'),
      transform: uniform('u_transform'), space: uniform('u_space'), cursor: uniform('u_cursor'),
      shadersLinked: gl.getProgramParameter(program, gl.LINK_STATUS), error: gl.getError(),
    };
  });
  expect(recipe.webgl1).toBe(true);
  expect(recipe.shadersLinked).toBe(true);
  expect(recipe.error).toBe(0);
  for (const [actual, expected] of [
    [recipe.shape, [2, 0.54, 0.47, 0.04]],
    [recipe.surface, [1.54, 1.16, 0, 1]],
    [recipe.finish, [0, 0.21, 0.002, 0.10]],
    [recipe.transform, [4012, 5.65, 0.12, 0]],
    [recipe.space, [0.11, -0.19, 0, 0]],
    [recipe.cursor, [0, 2, 0.65, 0.46]],
  ]) {
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
  }
  await page.keyboard.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  const draws = await drawCount(page);
  await page.waitForTimeout(200);
  expect(await drawCount(page)).toBe(draws);
  await page.reload();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('RAF pausa com aba oculta e preferência de movimento reduzido', async ({ page }) => {
  await monitorDraws(page);
  await page.goto('/');
  const canvas = page.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await expect.poll(() => drawCount(page)).toBeGreaterThan(2);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-state', 'paused');
  const paused = await drawCount(page);
  await page.waitForTimeout(250);
  expect(await drawCount(page)).toBe(paused);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await expect.poll(() => drawCount(page)).toBeGreaterThan(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
  await expect(canvas).toHaveAttribute('data-state', 'still', { timeout: 20000 });
  const still = await drawCount(page);
  await page.mouse.move(150, 150);
  await page.waitForTimeout(250);
  expect(await drawCount(page)).toBe(still);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
  await expect.poll(() => drawCount(page)).toBeGreaterThan(still);
});

for (const theme of ['light', 'dark'] as const) {
  test(`abertura ${theme}: composição desktop e mobile sem cortes ou overflow`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', colorScheme: theme, deviceScaleFactor: 3 });
    const page = await context.newPage();
    try {
      for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 740 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3100/');
        const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
        await expect(dialog).toBeVisible();
        await expect(dialog.locator('[data-waves-background]')).toHaveAttribute('data-state', 'still', { timeout: 20000 });
        await expect(dialog.locator('[data-waves-background]')).toHaveAttribute('data-renderer', 'worker');
        await page.evaluate(() => document.fonts.ready);
        const heading = dialog.getByRole('heading');
        await expect(heading).toHaveText(phrase);
        await expect(heading).toHaveCSS('font-weight', '900');
        const button = dialog.getByRole('button', { name: 'Continuar para o site' });
        for (const element of [heading, button]) {
          const bounds = await element.boundingBox();
          expect(bounds!.x).toBeGreaterThanOrEqual(0);
          expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
          expect(bounds!.y).toBeGreaterThanOrEqual(0);
          expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
          expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
        }
        // Transferred HTML canvas attributes keep their original values; inspect
        // the dimensions reported by the worker's actual drawing buffer instead.
        const canvas = await dialog.locator('[data-waves-background]').evaluate((element: HTMLCanvasElement) => ({ width: Number(element.dataset.bufferWidth), height: Number(element.dataset.bufferHeight) }));
        expect(canvas).toEqual({ width: viewport.width * 2, height: viewport.height * 2 });
        expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`waves-${theme}-${viewport.width}.png`) });
      }
    } finally {
      await context.close();
    }
  });
}

test('sem WebGL a abertura mantém a composição e permite entrar', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { configurable: true, value: undefined });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      if (type === 'webgl' || type === 'experimental-webgl') return null;
      return original.call(this, type, options);
    } as typeof original;
  });
  await page.goto('/');
  await expect(page.locator('[data-waves-background]')).toHaveAttribute('data-state', 'fallback');
  await expect(page.getByRole('heading', { name: phrase })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar para o site' }).click();
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
});

test('perda de contexto WebGL oferece fallback e restaura o shader', async ({ page }) => {
  await monitorDraws(page);
  await page.goto('/');
  const canvas = page.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await canvas.evaluate((element: HTMLCanvasElement) => {
    const extension = element.getContext('webgl')!.getExtension('WEBGL_lose_context')!;
    Object.assign(window, { __wavesContext: extension });
    extension.loseContext();
  });
  await expect(canvas).toHaveAttribute('data-state', 'context-lost');
  await page.waitForTimeout(100);
  await page.evaluate(() => (window as unknown as { __wavesContext: WEBGL_lose_context }).__wavesContext.restoreContext());
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
});

test('links diretos para seções não são bloqueados pela abertura', async ({ page }) => {
  await page.goto('/#services');
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
  await expect(page.locator('#services')).toBeVisible();
  await expect(page).toHaveURL(/#services$/);
});

test('worker WebGL anima sem bloquear a interface e pausa fora da aba', async ({ page }) => {
  await page.addInitScript(() => {
    const OriginalWorker = Worker;
    window.Worker = class extends OriginalWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        Object.assign(window, { __wavesWorker: this });
      }
    };
  });
  const inspect = () => page.evaluate(() => new Promise<{ frames: number; cursor: number[]; error: number }>(resolve => {
    const worker = (window as unknown as { __wavesWorker: Worker }).__wavesWorker;
    const receive = ({ data }: MessageEvent) => {
      if (data.type !== 'inspection') return;
      worker.removeEventListener('message', receive);
      resolve(data);
    };
    worker.addEventListener('message', receive);
    worker.postMessage({ type: 'inspect' });
  }));
  await page.goto('/');
  const canvas = page.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-renderer', 'worker');
  await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
  const initial = await inspect();
  expect(initial.frames).toBeGreaterThan(0);
  expect(initial.error).toBe(0);
  expect(initial.cursor[0]).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-state', 'paused');
  const paused = await inspect();
  await page.waitForTimeout(250);
  expect((await inspect()).frames).toBe(paused.frames);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden');
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
});

for (const width of [1366, 390]) {
  test(`${width}px: saída faz crossfade mantendo o último frame e sem cobrir a home com o backdrop`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
    const canvas = dialog.locator('[data-waves-background]');
    await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
    await dialog.getByRole('button', { name: 'Continuar para o site' }).click();
    await expect(dialog).toHaveAttribute('data-leaving', 'true', { timeout: 20000 });
    await expect(canvas).toHaveAttribute('data-state', 'paused');
    await expect(dialog.locator('.waves-entry-stars canvas')).toHaveAttribute('data-motion', 'paused');
    await page.waitForTimeout(180);
    const transition = await dialog.evaluate(element => ({
      opacity: Number(getComputedStyle(element).opacity),
      backdrop: getComputedStyle(element, '::backdrop').backgroundColor,
      scrollY: window.scrollY,
    }));
    expect(transition.opacity).toBeGreaterThan(0);
    expect(transition.opacity).toBeLessThan(1);
    expect(transition.backdrop).toBe('rgba(0, 0, 0, 0)');
    expect(transition.scrollY).toBe(0);
    await expect(canvas).toHaveAttribute('data-state', 'paused');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#hero')).toBeFocused();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');

    // Replay from the footer must reveal the hero, not the footer followed by a jump.
    const cookies = page.getByRole('dialog', { name: 'Aviso de cookies' });
    if (await cookies.isVisible()) await cookies.getByRole('button', { name: 'Recusar', exact: true }).click();
    await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Continuar para o site' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#hero')).toBeFocused();
  });
}
