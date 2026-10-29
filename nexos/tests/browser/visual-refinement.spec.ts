import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  for (const width of [390, 1366]) {
    test(`${theme} / ${width}px: quiet atmosphere, floating header and readable actions`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.addInitScript(theme => {
        localStorage.setItem('nexos-theme', theme);
        localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      }, theme);
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      const header = page.getByRole('banner');
      await expect(header).toHaveAttribute('data-header-state', 'assembled');
      expect(await header.evaluate(el => getComputedStyle(el, '::before').opacity)).toBe('1');
      await expect(page.locator('#hero h1')).toHaveCSS('opacity', '1');
      await expect(page.locator('.waves-entry')).toHaveCount(0);

      const atmosphere = page.locator('#hero [data-brand-veil]');
      await expect(atmosphere.locator('.brand-veil-light')).toHaveCSS('background-image', /radial-gradient/);
      const grain = atmosphere.locator('.grainient-container');
      await expect(grain).toHaveAttribute('data-render-state', /ready|unavailable/);
      const intensity = await atmosphere.locator('.hero-grain-field').evaluate(el => Number(getComputedStyle(el).opacity));
      expect(intensity).toBeGreaterThan(.1);
      expect(intensity).toBeLessThan(.4);
      if (await grain.getAttribute('data-render-state') === 'ready') {
        const amount = await grain.locator('canvas').evaluate((canvas: HTMLCanvasElement) => {
          const gl = canvas.getContext('webgl2')!;
          const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
          const location = gl.getUniformLocation(program, 'uGrain');
          if (!location) throw new Error('The hero grain uniform is missing');
          return gl.getUniform(program, location) as number;
        });
        expect(amount).toBeCloseTo(theme === 'dark' ? .24 : .2, 5);
      }
      const texture = await atmosphere.evaluate(el => Number(getComputedStyle(el, '::before').opacity));
      expect(texture).toBeGreaterThan(.06);
      expect(texture).toBeLessThan(.1);
      const primary = page.locator('.hero-actions').getByRole('link', { name: 'Entrar em contato', exact: true });
      await expect(primary).toHaveCSS('color', 'rgb(255, 255, 255)');
      await expect(primary).toHaveCSS('background-image', /linear-gradient/);
      const actions = await page.locator('.hero-actions').boundingBox();
      expect(actions!.y + actions!.height).toBeLessThan(844);
      await primary.focus();
      await expect(primary).toBeFocused();
      await expect(primary).toHaveCSS('outline-style', 'solid');
      await page.screenshot({ path: testInfo.outputPath(`hero-${theme}-${width}.png`) });

      await page.mouse.wheel(0, 700);
      await expect(header).toHaveAttribute('data-header-state', 'assembled');
      expect(await header.evaluate(el => getComputedStyle(el, '::before').opacity)).toBe('1');
      expect(await header.evaluate(el => getComputedStyle(el, '::before').backdropFilter)).toContain('blur(36px)');
      if (width < 1200) {
        await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
        await expect(page.getByRole('navigation', { name: 'Navegação móvel', exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('navigation', { name: 'Navegação móvel', exact: true })).toHaveCount(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(errors).toEqual([]);
    });
  }
}
