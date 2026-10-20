import { expect, test } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.setTimeout(60000);

test('tema claro usa Topography WebGL2 e roxo/lilás da viseira', async ({ page }, testInfo) => {
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
  [151 / 255, 30 / 255, 244 / 255].forEach((value, i) => expect(uniforms.low[i]).toBeCloseTo(value, 5));
  [232 / 255, 115 / 255, 248 / 255].forEach((value, i) => expect(uniforms.mid[i]).toBeCloseTo(value, 5));
  await page.screenshot({ path: testInfo.outputPath('topography-intro-light.png') });
  await enterPresentation(page);
  const mascot = page.getByRole('img', { name: 'Mascote tigre albino da NexOS com viseira roxa' });
  await expect(mascot).toHaveAttribute('src', /\/_next\/static\/media\/tigre_albino_capuz_fino\.[\w-]+\.svg$/);
  await expect(mascot).toHaveCSS('filter', 'none');
  await expect(page.locator('#hero [data-topography]')).toHaveCount(0);
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="waves"] [data-topography]').first()).toHaveAttribute('data-motion', 'animated', { timeout: 15000 });
  await page.screenshot({ path: testInfo.outputPath('topography-hero-light.png') });
  expect(errors).toEqual([]);
});

for (const theme of ['light', 'dark']) {
  test(`paleta roxa ${theme} é consistente em home, serviço, acesso e páginas legais`, async ({ page }, testInfo) => {
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['/', '/criacao-de-sites', '/portal/acesso', '/termos']) {
      await page.goto(route);
      if (route === '/') await enterPresentation(page);
      await expect(page.locator('body')).toHaveCSS('background-color', theme === 'light' ? 'rgb(253, 246, 236)' : 'rgb(0, 0, 0)');
      const palette = await page.evaluate(() => {
        const style = getComputedStyle(document.documentElement);
        return { primary: style.getPropertyValue('--primary').trim(), gradient: style.getPropertyValue('--action-gradient') };
      });
      expect(palette.primary).toBe(theme === 'light' ? '#971ef4' : '#e873f8');
      expect(palette.gradient).toContain('#971ef4'); expect(palette.gradient).toContain('#34064e');
      const surface = page.locator('[data-metallic-surface]').first();
      if (await surface.count()) {
        const finish = await surface.evaluate(e => getComputedStyle(e, '::after').backgroundImage);
        expect(finish).toContain('151, 30, 244');
        expect(finish).toContain('52, 6, 78');
      }
      for (const width of [360, 1366]) {
        await page.setViewportSize({ width, height: 844 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`${theme}-${width}-${route.replaceAll('/', '-') || 'home'}.png`) });
      }
    }
  });
}

test('tema escuro usa lilás da viseira e alternância não deixa canvases antigos', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-theme', 'dark'));
  await page.goto('/'); await enterPresentation(page);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#e873f8');
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="waves"] [data-topography]').first()).toBeVisible();
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('[data-scene="waves"] [data-topography]')).toHaveCount(0);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--primary').trim())).toBe('#e873f8');
});
