import { test, expect } from '@playwright/test';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

for (const theme of ['light', 'dark']) {
  test(`${theme}: local font roles, reading contrast and responsive backgrounds`, async ({ page }) => {
    test.setTimeout(90000);
    const remoteFontRequests: string[] = [];
    page.on('request', request => {
      if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) remoteFontRequests.push(request.url());
    });
    await page.addInitScript(theme => {
      localStorage.setItem('nexos-theme', theme);
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    }, theme);
    await page.goto('/#showcase');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
    await expect(page.locator('header [class*="wordmark"]')).toHaveCSS('color', theme === 'light' ? 'rgb(0, 0, 0)' : 'rgb(249, 243, 250)');

    const roles = await page.evaluate(() => {
      const title = getComputedStyle(document.querySelector('#showcase-title')!);
      const body = getComputedStyle(document.querySelector('#showcase-title + p')!);
      const quantity = getComputedStyle(document.querySelector('#showcase output')!);
      const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(channel => Number(channel) * (value.startsWith('color(srgb ') ? 255 : 1));
      const luminance = (value: number[]) => value.map(channel => channel / 255).map(channel => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4).reduce((sum, channel, index) => sum + channel * [.2126, .7152, .0722][index], 0);
      const sample = document.createElement('span');
      sample.style.color = getComputedStyle(document.querySelector('#showcase')!).getPropertyValue('--color-canvas');
      document.body.append(sample);
      const bg = luminance(rgb(getComputedStyle(sample).color));
      const fg = luminance(rgb(body.color));
      sample.remove();
      return { titleFamily: title.fontFamily, titleSize: parseFloat(title.fontSize), bodyFamily: body.fontFamily, bodySize: parseFloat(body.fontSize), quantityFamily: quantity.fontFamily, contrast: (Math.max(bg, fg) + .05) / (Math.min(bg, fg) + .05), archivoLoaded: document.fonts.check('800 48px "Archivo"', 'Conexões à sua marca'), monoLoaded: document.fonts.check('400 16px "Martian Mono"', '12345') };
    });
    expect(roles.titleFamily).toContain('Archivo');
    expect(roles.quantityFamily).toContain('Martian Mono');
    expect(roles.bodyFamily).toContain('system-ui');
    expect(roles.titleSize).toBeGreaterThan(roles.bodySize * 1.8);
    expect(roles.bodySize).toBeGreaterThanOrEqual(17);
    expect(roles.contrast).toBeGreaterThanOrEqual(4.5);
    expect(roles.archivoLoaded && roles.monoLoaded).toBe(true);
    await expect(page.locator('[data-scene="product"] [class*="fieldImage"]')).toBeVisible();
    if (theme === 'dark') {
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect(page.locator('.hero-ascii')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
      await expect(page.locator('.hero-ascii')).toHaveCSS('background-image', 'none');
      const scenes = await page.locator('[data-tone]').all();
      for (const [index, scene] of scenes.entries()) {
        await expect(scene).toHaveAttribute('data-dark-tone', index % 2 === 0 ? 'alternate' : 'base');
        await expect(scene).toHaveCSS('background-image', 'none');
        if (index % 2 === 1) await expect(scene).toHaveCSS('background-color', 'rgb(0, 0, 0)');
        else await expect(scene).not.toHaveCSS('background-color', 'rgb(0, 0, 0)');
      }
      for (const scenery of await page.locator('[data-scene="waves"] > [aria-hidden="true"], [data-scene="product"] > [aria-hidden="true"]').all()) {
        await expect(scenery).toHaveCSS('background-image', 'none');
      }
      await expect(page.locator('[data-scene="product"] [class*="fieldImage"]')).toHaveCSS('background-image', /nexos-field-dark\.svg/);
      const artwork = await page.request.get('/nexos-field-dark.svg');
      expect(await artwork.text()).not.toContain('radialGradient');
      await expect(page.locator('#showcase input[name="plate-study"]')).toHaveCount(3);
      await page.locator('#hero').scrollIntoViewIfNeeded();
      await expect(page.locator('#hero canvas')).toBeVisible();
    }

    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of ['hero', 'showcase', 'services', 'testimonials', 'faq', 'mascot-solutions', 'cta-final']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id} at ${width}`).toBe(true);
      }
      if (width === 390 || width === 1440) {
        await page.locator('#showcase').screenshot({ path: `test-results/type-plate-${theme}-${width}.png` });
      }
    }
    for (const path of ['/criacao-de-sites', '/privacidade', '/portal/acesso']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole('heading').first()).toHaveCSS('font-family', /Archivo/);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}`).toBe(true);
      }
      await page.screenshot({ path: `test-results/type-${path.slice(1).replaceAll('/', '-')}-${theme}.png` });
    }
    expect(remoteFontRequests).toEqual([]);
  });
}
