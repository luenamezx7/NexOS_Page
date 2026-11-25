import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 820, height: 1180 }, { width: 1440, height: 1000 }, { width: 1920, height: 1080 }, { width: 844, height: 390 }]) {
  test(`Silk card and readable login at ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/portal/acesso');
    const canvas = page.locator('[data-silk-background]');
    await expect(canvas).toHaveAttribute('data-silk-state', 'static');
    await expect(canvas).toHaveCount(1);
    await expect(page.locator('[data-client-portal]')).toHaveAttribute('data-portal-theme', 'dark');
    await expect(page.locator('main')).toHaveCSS('color-scheme', 'dark');
    await expect(page.getByLabel('E-mail', { exact: true })).toHaveCSS('color', 'rgb(241, 246, 239)');
    await expect(page.getByRole('contentinfo')).toHaveCount(0);
    await expect(page.locator('main aside, [data-auth-identity]')).toHaveCount(0);
    const alignment = await page.locator('section[aria-labelledby="login-title"]').evaluate(section => {
      const panel = section.getBoundingClientRect();
      const frame = document.querySelector('[data-silk-frame]')!.getBoundingClientRect();
      const brand = section.querySelector('a[aria-label="ezway — página inicial"]')!.getBoundingClientRect();
      return { panel: panel.x + panel.width / 2, frame: frame.x + frame.width / 2, brand: brand.x + brand.width / 2, y: panel.y + panel.height / 2, frameY: frame.y + frame.height / 2 };
    });
    expect(Math.abs(alignment.panel - alignment.frame)).toBeLessThan(1);
    expect(Math.abs(alignment.brand - alignment.frame)).toBeLessThan(1);
    expect(Math.abs(alignment.y - alignment.frameY)).toBeLessThan(1);
    await page.evaluate(() => document.fonts.ready);
    const sizes = await canvas.evaluate(canvas => {
      const c = canvas as HTMLCanvasElement;
      const frame = c.parentElement!.getBoundingClientRect();
      const input = document.querySelector('#login-email')!.getBoundingClientRect();
      return { frame: { x: frame.x, y: frame.y, width: frame.width }, input: input.width, backing: c.width, css: c.clientWidth, dpr: devicePixelRatio, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(sizes.frame.x).toBeGreaterThanOrEqual(16);
    expect(sizes.frame.y).toBeGreaterThanOrEqual(16);
    expect(sizes.frame.x + sizes.frame.width).toBeLessThanOrEqual(viewport.width - 16);
    expect(sizes.overflow).toBe(false);
    expect(sizes.input).toBeGreaterThan(190);
    expect(sizes.backing).toBeCloseTo(sizes.css * Math.min(sizes.dpr, 2), -1);
    await page.getByLabel('E-mail', { exact: true }).fill('person@example.test');
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('silk-login.png'), fullPage: true });
  });
}

test('WebGL1 uses the supplied preset and pauses rendering while hidden', async ({ page }) => {
  await page.addInitScript(() => {
    const state = { hidden: false, draws: 0 };
    Object.assign(window, { silkTest: state });
    Object.defineProperty(document, 'hidden', { get: () => state.hidden, configurable: true });
    const draw = WebGLRenderingContext.prototype.drawArrays;
    WebGLRenderingContext.prototype.drawArrays = function (...args) { state.draws++; return draw.apply(this, args); };
  });
  await page.goto('/portal/acesso');
  const canvas = page.locator('[data-silk-background]');
  await expect(canvas).toHaveAttribute('data-silk-state', 'running');
  const preset = await canvas.evaluate(canvas => {
    const gl = (canvas as HTMLCanvasElement).getContext('webgl')!;
    const program = gl.getParameter(gl.CURRENT_PROGRAM) as WebGLProgram;
    return Object.fromEntries(['u_shape', 'u_surface', 'u_finish', 'u_transform', 'u_space', 'u_cursor'].map(name => [name, Array.from(gl.getUniform(program, gl.getUniformLocation(program, name)!) as Float32Array)]));
  });
  const expected = { u_shape: [1.26, .09, .5, 0], u_surface: [2.4, 1.11, 0, 1], u_finish: [0, 0, 0, .22], u_transform: [1581, 0, 0, 0], u_space: [-.23, 0, 0, 0], u_cursor: [0, 2, .65, .46] };
  for (const [name, values] of Object.entries(expected)) values.forEach((value, i) => expect(preset[name][i]).toBeCloseTo(value, 5));
  await page.evaluate(() => { (window as unknown as { silkTest: { hidden: boolean } }).silkTest.hidden = true; document.dispatchEvent(new Event('visibilitychange')); });
  await expect(canvas).toHaveAttribute('data-silk-state', 'paused');
  const count = () => page.evaluate(() => (window as unknown as { silkTest: { draws: number } }).silkTest.draws);
  const paused = await count();
  await page.waitForTimeout(150);
  expect(await count()).toBe(paused);
  await page.evaluate(() => { (window as unknown as { silkTest: { hidden: boolean } }).silkTest.hidden = false; document.dispatchEvent(new Event('visibilitychange')); });
  await expect.poll(count).toBeGreaterThan(paused);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(canvas).toHaveAttribute('data-silk-state', 'static');
  const frozen = await count();
  await page.waitForTimeout(150);
  expect(await count()).toBe(frozen);
});

test('context loss recovers and the canvas resizes without replacing the input', async ({ page }) => {
  await page.goto('/portal/acesso');
  const canvas = page.locator('[data-silk-background]');
  await expect(canvas).toHaveAttribute('data-silk-state', 'running');
  await page.getByLabel('E-mail', { exact: true }).fill('retained@example.test');
  await canvas.evaluate(canvas => {
    const extension = (canvas as HTMLCanvasElement).getContext('webgl')!.getExtension('WEBGL_lose_context')!;
    Object.assign(window, { silkRestore: () => extension.restoreContext() });
    extension.loseContext();
  });
  await expect(canvas).toHaveAttribute('data-silk-state', 'fallback');
  await page.waitForTimeout(100);
  await page.evaluate(() => (window as unknown as { silkRestore: () => void }).silkRestore());
  await expect(canvas).toHaveAttribute('data-silk-state', 'running');
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue('retained@example.test');
  await expect.poll(() => canvas.evaluate(c => Math.abs((c as HTMLCanvasElement).width - c.clientWidth * Math.min(devicePixelRatio, 2)))).toBeLessThan(2);
});

for (const failure of ['unavailable', 'compilation'] as const) {
  test(`shader ${failure} leaves a usable login and static fallback`, async ({ page }) => {
    await page.addInitScript(failure => {
      if (failure === 'compilation') {
        const original = WebGLRenderingContext.prototype.getShaderParameter;
        WebGLRenderingContext.prototype.getShaderParameter = function (shader, parameter) { return parameter === this.COMPILE_STATUS ? false : original.call(this, shader, parameter); };
      } else {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
          if (type === 'webgl') return null;
          return Reflect.apply(original, this, [type, ...args]);
        } as typeof original;
      }
    }, failure);
    await page.goto('/portal/acesso');
    await expect(page.locator('[data-silk-background]')).toHaveAttribute('data-silk-state', 'fallback');
    await page.getByLabel('E-mail', { exact: true }).fill('fallback@example.test');
    await page.getByRole('button', { name: 'Esqueceu a senha?' }).click();
    await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
  });
}

test('high contrast and MFA retain usable controls; operator entry stays outside the theme', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  await page.goto('/portal/acesso?mfa=required');
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible();
  await expect(page.locator('[data-silk-background]')).toHaveCSS('display', 'none');
  await page.getByLabel('Código do autenticador', { exact: true }).fill('123456');
  await page.goto('/admin-dashboard-su/secure-entry');
  await expect(page.locator('[data-client-portal]')).toHaveCount(0);
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
});

test('high-DPR and enlarged layout keep the canvas sharp and the panel centered', async ({ browser, baseURL }, info) => {
  const context = await browser.newContext({ viewport: { width: 720, height: 900 }, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  try {
    await context.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    const page = await context.newPage();
    await page.goto(`${baseURL}/portal/acesso`);
    const canvas = page.locator('[data-silk-background]');
    await expect(canvas).toHaveAttribute('data-silk-state', 'static');
    const pixels = await canvas.evaluate(element => ({ width: (element as HTMLCanvasElement).width, css: element.getBoundingClientRect().width }));
    expect(Math.abs(pixels.width - pixels.css * 2)).toBeLessThan(2);
    await page.getByLabel('E-mail', { exact: true }).fill('zoom@example.test');
    await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await page.screenshot({ path: info.outputPath('silk-high-dpr.png'), fullPage: true });
  } finally { await context.close(); }
});

test('legal documents share the dark glass, readable text and active navigation', async ({ page }) => {
  const material = (element: Element) => {
    const css = getComputedStyle(element);
    return { background: css.background, border: css.borderColor, shadow: css.boxShadow, filter: css.backdropFilter.replace(/url\([^)]*\)/g, '').replace(/\s+/g, ' ').trim() };
  };
  await page.goto('/portal/acesso');
  await expect(page.locator('[data-client-portal]')).toHaveAttribute('data-portal-theme', 'dark');
  const reference = await page.locator('section[aria-labelledby="login-title"] .bg-card').evaluate(material);
  for (const path of ['/lgpd', '/privacidade', '/termos', '/cookies', '/reembolso']) {
    await page.goto(path);
    await expect(page.locator('[data-client-portal]')).toHaveAttribute('data-portal-theme', 'dark');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('[data-page-header]')).toBeVisible();
    expect(await page.locator('.legal-document').evaluate(material)).toEqual(reference);
    await expect(page.locator('.page-tab[aria-current="page"]')).toHaveAttribute('href', path);
    await expect(page.locator('.legal-document h2').first()).toHaveCSS('color', 'rgb(241, 246, 239)');
    await expect(page.locator('.legal-document section p').first()).toHaveCSS('color', 'rgb(181, 194, 179)');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  }
});
