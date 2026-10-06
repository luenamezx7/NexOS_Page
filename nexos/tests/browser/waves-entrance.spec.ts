import { expect, test, type Page } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.setTimeout(90000);
const phrase = 'Nexos, a performance que seu business merece.';
async function darkTheme(page: Page) { await page.addInitScript(() => localStorage.setItem('nexos-theme', 'dark')); }
async function monitorDraws(page: Page) {
  await darkTheme(page);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { configurable: true, value: undefined });
    Object.assign(window, { __wavesDraws: 0 });
    const original = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (mode, first, count) {
      if (this.canvas instanceof HTMLCanvasElement && this.canvas.hasAttribute('data-waves-background')) (window as unknown as { __wavesDraws: number }).__wavesDraws++;
      return original.call(this, mode, first, count);
    };
  });
}
const draws = (page: Page) => page.evaluate(() => (window as unknown as { __wavesDraws: number }).__wavesDraws);

test('abertura escura mantém a receita Waves e as estrelas, sem CTA de entrada', async ({ page }) => {
  await monitorDraws(page); await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog).toBeFocused(); await expect(dialog.getByRole('heading')).toHaveText(phrase);
  await expect(dialog.getByRole('button')).toHaveCount(0); await expect(dialog.getByRole('link')).toHaveCount(0);
  await page.keyboard.press('Escape'); await page.keyboard.press('Enter'); await expect(dialog).toBeVisible();
  const canvas = dialog.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
  const recipe = await canvas.evaluate((element: HTMLCanvasElement) => {
    const gl = element.getContext('webgl')!, program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    const value = (name: string) => Array.from(gl.getUniform(program, gl.getUniformLocation(program, name)!) as Float32Array);
    return { shape: value('u_shape'), cursor: value('u_cursor'), finish: value('u_finish'), error: gl.getError() };
  });
  expect(recipe.error).toBe(0); expect(recipe.shape[0]).toBe(2);
  expect(recipe.shape[1]).toBeCloseTo(0.54); expect(recipe.cursor[0]).toBe(0);
  expect(recipe.finish[1]).toBeCloseTo(0.21);
  const stars = dialog.locator('.waves-entry-stars canvas');
  await expect(stars).toHaveAttribute('data-motion', 'animated');
  const white = await stars.evaluate((e: HTMLCanvasElement) => {
    const p = e.getContext('2d')!.getImageData(0, 0, e.width, e.height).data;
    let n = 0; for (let i = 0; i < p.length; i += 4) if (p[i] > 240 && p[i + 1] > 240 && p[i + 2] > 240 && p[i + 3] > 30) n++;
    return n;
  });
  expect(white).toBeGreaterThan(100);
  await enterPresentation(page); await expect(page.locator('#hero')).toBeFocused();
  const count = await draws(page); await page.waitForTimeout(200); expect(await draws(page)).toBe(count);
});

test('Waves pausa em aba oculta e em movimento reduzido', async ({ page }) => {
  await monitorDraws(page); await page.goto('/');
  const canvas = page.locator('[data-waves-background]');
  await expect(canvas).toHaveAttribute('data-state', 'animated', { timeout: 20000 });
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(canvas).toHaveAttribute('data-state', 'paused');
  const count = await draws(page); await page.waitForTimeout(200); expect(await draws(page)).toBe(count);
  await page.evaluate(() => { Reflect.deleteProperty(document, 'hidden'); document.dispatchEvent(new Event('visibilitychange')); });
  await expect(canvas).toHaveAttribute('data-state', 'animated');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-state', 'still', { timeout: 15000 });
  await enterPresentation(page);
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: desktop, mobile e paisagem permanecem legíveis sem cortes`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ baseURL: 'http://localhost:3100', reducedMotion: 'reduce', colorScheme: theme, deviceScaleFactor: 3 });
    await context.addInitScript(t => localStorage.setItem('nexos-theme', t), theme);
    const page = await context.newPage();
    try {
      for (const viewport of [{ width: 1366, height: 768 }, { width: 360, height: 740 }, { width: 844, height: 390 }]) {
        await page.setViewportSize(viewport); await page.goto('/');
        const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
        await expect(dialog).toBeFocused(); await expect(dialog.getByRole('heading')).toHaveText(phrase);
        await expect(dialog.getByRole('button')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        const box = await dialog.getByRole('heading').boundingBox();
        expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
        expect(await dialog.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
        if (theme === 'light') await expect(dialog.locator('[data-topography]')).toHaveAttribute('data-motion', 'static', { timeout: 15000 });
        else await expect(dialog.locator('[data-waves-background]')).toHaveAttribute('data-state', 'still', { timeout: 15000 });
        await page.screenshot({ path: testInfo.outputPath(`entry-${theme}-${viewport.width}.png`) });
        await enterPresentation(page);
      }
    } finally { await context.close(); }
  });
}

test('sem WebGL ainda é possível entrar rolando', async ({ page }) => {
  await darkTheme(page);
  await page.addInitScript(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, 'transferControlToOffscreen', { configurable: true, value: undefined });
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, options?: unknown) {
      return type === 'webgl' ? null : original.call(this, type, options);
    } as typeof original;
  });
  await page.goto('/'); await expect(page.locator('[data-waves-background]')).toHaveAttribute('data-state', 'fallback');
  await enterPresentation(page); await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
});

test('F5 reabre, mesmo com a marca de sessão antiga; rotas internas não reiniciam', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/'); await enterPresentation(page);
  await page.reload(); await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toBeFocused();
  await enterPresentation(page);
  await page.getByRole('link', { name: 'Criação de sites', exact: true }).click();
  await expect(page).toHaveURL(/\/criacao-de-sites$/);
  await page.getByRole('link', { name: 'NexOS, página inicial', exact: true }).click();
  await expect(page).toHaveURL(/\/$/); await expect(page.locator('.waves-entry')).toHaveCount(0);
  await page.reload(); await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toBeFocused();
});

test('abrir documento em rota interna e voltar à home não mostra apresentação', async ({ page }) => {
  await page.goto('/criacao-de-sites');
  await page.getByRole('link', { name: 'NexOS, página inicial', exact: true }).click();
  await expect(page).toHaveURL(/\/$/); await expect(page.locator('.waves-entry')).toHaveCount(0);
  await page.reload(); await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toBeFocused();
});

test('seções por âncora não reiniciam, mas recarregar com hash reabre', async ({ page }) => {
  await page.goto('/#services'); await expect(page.locator('.waves-entry')).toHaveCount(0);
  await expect(page).toHaveURL(/#services$/);
  await page.reload(); await expect(page.getByRole('dialog', { name: 'Apresentação NexOS' })).toBeFocused();
  await enterPresentation(page); await expect(page.locator('#hero')).toBeFocused();
});
