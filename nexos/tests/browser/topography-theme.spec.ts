import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.setTimeout(60000);

test('tema claro usa Topography WebGL2 e uma paleta azul real', async ({ page }, testInfo) => {
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
  [36 / 255, 112 / 255, 179 / 255].forEach((value, i) => expect(uniforms.low[i]).toBeCloseTo(value, 5));
  [134 / 255, 203 / 255, 249 / 255].forEach((value, i) => expect(uniforms.mid[i]).toBeCloseTo(value, 5));
  await page.screenshot({ path: testInfo.outputPath('topography-intro-light.png') });
  await enterPresentation(page);
  await expect(page.locator('.site-atmosphere [data-topography]')).toHaveAttribute('data-motion', 'animated', { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('topography-hero-light.png') });
  expect(errors).toEqual([]);
});

test('paleta clara é consistente em home, serviço, acesso e páginas legais', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'light'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/criacao-de-sites', '/portal/acesso', '/termos']) {
    await page.goto(route);
    if (route === '/') await enterPresentation(page);
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(239, 248, 255)');
    const palette = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return { primary: style.getPropertyValue('--primary').trim(), gradient: style.getPropertyValue('--action-gradient') };
    });
    expect(palette.primary).toBe('#1466a8'); expect(palette.gradient).not.toContain('#d60070');
    const surface = page.locator('[data-metallic-surface]').first();
    if (await surface.count()) {
      const finish = await surface.evaluate(e => getComputedStyle(e, '::after').backgroundImage);
      expect(finish).toContain('20, 85, 140');
      expect(finish).not.toContain('225, 0, 117');
    }
    for (const width of [360, 1366]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.screenshot({ path: testInfo.outputPath(`light-${route.replaceAll('/', '-') || 'home'}.png`) });
  }
});

test('tema escuro preserva rosa e alternância não deixa canvases antigos', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'dark'));
  await page.goto('/'); await enterPresentation(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#d60070');
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await expect(page.locator('.site-atmosphere [data-topography]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('.site-atmosphere [data-topography]')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#d60070');
});
