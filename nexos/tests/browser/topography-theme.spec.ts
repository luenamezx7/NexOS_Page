import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.setTimeout(60000);

test('tema claro usa Topography WebGL2 e azul/ciano da viseira', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'light'));
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  const topology = dialog.locator('[data-topography]');
  await expect(topology).toHaveAttribute('data-motion', 'animated', { timeout: 15000 });
  await expect(dialog.locator('[data-waves-background]')).toHaveCount(0);
  await expect(dialog.getByRole('button')).toHaveCount(0);
  const uniforms = await topology.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
    const gl = canvas.getContext('webgl2')!, program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return { light: gl.getUniform(program, gl.getUniformLocation(program, 'uLightMode')!),
      low: Array.from(gl.getUniform(program, gl.getUniformLocation(program, 'uLow')!) as Float32Array),
      mid: Array.from(gl.getUniform(program, gl.getUniformLocation(program, 'uMid')!) as Float32Array), error: gl.getError() };
  });
  expect(uniforms.light).toBe(1); expect(uniforms.error).toBe(0);
  [0, 93 / 255, 218 / 255].forEach((value, i) => expect(uniforms.low[i]).toBeCloseTo(value, 5));
  [11 / 255, 210 / 255, 211 / 255].forEach((value, i) => expect(uniforms.mid[i]).toBeCloseTo(value, 5));
  await page.screenshot({ path: testInfo.outputPath('topography-intro-light.png') });
  await enterPresentation(page);
  const mascot = page.getByRole('img', { name: 'Mascote lobo da NexOS com viseira multicolorida' });
  await expect(mascot).toHaveAttribute('src', '/mascote-lobo-header.svg');
  await expect(mascot).toHaveCSS('filter', 'none');
  await expect(page.locator('#hero [data-topography]')).toHaveCount(0);
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="waves"] [data-topography]').first()).toHaveAttribute('data-motion', 'animated', { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('topography-hero-light.png') });
  expect(errors).toEqual([]);
});

test('paleta clara é consistente em home, serviço, acesso e páginas legais', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'light'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/criacao-de-sites', '/portal/acesso', '/termos']) {
    await page.goto(route);
    if (route === '/') await enterPresentation(page);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(253, 246, 236)');
    const palette = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return { primary: style.getPropertyValue('--primary').trim(), gradient: style.getPropertyValue('--action-gradient') };
    });
    expect(palette.primary).toBe('#005dda'); expect(palette.gradient).toContain('#3328bc');
    const surface = page.locator('[data-metallic-surface]').first();
    if (await surface.count()) {
      const finish = await surface.evaluate(e => getComputedStyle(e, '::after').backgroundImage);
      expect(finish).toContain('0, 93, 218');
      expect(finish).toContain('51, 40, 188');
    }
    for (const width of [360, 1366]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`light-${route.replaceAll('/', '-') || 'home'}.png`) });
  }
});

test('tema escuro usa magenta da viseira e alternância não deixa canvases antigos', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'dark'));
  await page.goto('/'); await enterPresentation(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#c20076');
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="waves"] [data-topography]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('[data-scene="waves"] [data-topography]')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#c20076');
});
