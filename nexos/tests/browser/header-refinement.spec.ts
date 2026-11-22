import { test, expect } from '@playwright/test';

const widths = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const header = (page: import('@playwright/test').Page) => page.locator('header[data-header-state]');

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/get-session', route => route.fulfill({ json: null }));
});

test('header geometry, languages and native glass at all requested widths', async ({ page }) => {
  test.setTimeout(180000);
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await expect(header(page)).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['Português', 'English', 'Español']) {
      await header(page).getByRole('button', { name: /Selecionar idioma|Select language|Seleccionar idioma/ }).click();
      await page.getByRole('menuitem', { name: language, exact: true }).click();
      await expect(page.getByRole('menu')).toHaveCount(0);
      const geometry = await header(page).evaluate(h => {
        const nav = h.querySelector('nav')!;
        const brand = h.querySelector('a')!.getBoundingClientRect();
        const n = nav.getBoundingClientRect();
        const actions = nav.nextElementSibling!.getBoundingClientRect();
        const r = h.getBoundingClientRect();
        const visible = [...h.querySelectorAll('a,button')].filter(e => e.getBoundingClientRect().width > 0);
        return {
          centerError: Math.abs((nav.firstElementChild!.getBoundingClientRect().left + nav.lastElementChild!.getBoundingClientRect().right) / 2 - innerWidth / 2),
          desktop: getComputedStyle(nav).display !== 'none',
          overlaps: brand.right > n.left || n.right > actions.left,
          fits: r.left >= 0 && r.right <= innerWidth && visible.every(e => {
            const b = e.getBoundingClientRect(); return b.left >= r.left && b.right <= r.right && b.height >= 44;
          }),
          filter: getComputedStyle(h).backdropFilter,
          svgCount: h.querySelectorAll('filter,feImage').length,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      });
      expect(geometry, `${width}/${language}`).toMatchObject({ desktop: width >= 1280, fits: true, svgCount: 0, overflow: false });
      expect(geometry.filter).toContain('blur(18px)');
      expect(geometry.filter).not.toContain('url(');
      if (geometry.desktop) {
        expect(geometry.centerError).toBeLessThanOrEqual(0.6);
        expect(geometry.overlaps).toBe(false);
      }
    }
    await page.screenshot({ path: `docs/header-audit/header-${width}.jpg`, type: 'jpeg', quality: 70, clip: { x: 0, y: 0, width, height: 110 } });
  }
});

test('mobile repeated open, Escape, outside click, focus trap and section navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await page.getByRole('button', { name: 'Recusar', exact: true }).click();
  const trigger = header(page).getByRole('button', { name: 'Abrir menu', exact: true });
  const dialog = page.locator('#mobile-navigation');
  for (let i = 0; i < 3; i++) {
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(dialog).toBeVisible();
    const panel = dialog.locator('[data-navigation-glass="panel"]');
    expect(await panel.evaluate(e => getComputedStyle(e).backdropFilter)).toContain('blur(18px)');
    expect(await panel.evaluate(e => { const b=e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.top >= 82 && b.bottom <= innerHeight; })).toBe(true);
    if (i === 0) {
      await expect(dialog.getByRole('button', { name: 'Fechar menu' })).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(dialog.getByRole('link', { name: 'Entrar', exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(dialog.getByRole('button', { name: 'Fechar menu' })).toBeFocused();
      await page.keyboard.press('Escape');
    } else if (i === 1) await dialog.getByRole('button', { name: 'Fechar menu' }).click();
    else await page.mouse.click(4, 650);
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  }
  await trigger.click();
  await dialog.getByRole('link', { name: 'Gestão', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page).toHaveURL(/#gestao$/);
  await expect.poll(async () => page.locator('#gestao').evaluate(e => e.getBoundingClientRect().top)).toBeGreaterThanOrEqual(80);
  await expect(page.locator('#gestao')).toBeFocused({ timeout: 10000 });
  for (const [width, height] of [[360, 640], [430, 844], [768, 900], [1024, 768], [360, 320]]) {
    await page.setViewportSize({ width, height });
    await trigger.click();
    const panel = dialog.locator('[data-navigation-glass="panel"]');
    expect(await panel.evaluate(e => { const b = e.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight; })).toBe(true);
    await expect(dialog.getByRole('button', { name: 'Fechar menu' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  }
  await trigger.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(dialog).not.toBeVisible();
});

test('language keyboard, outside close, stable scroll and destinations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  const language = header(page).getByRole('button', { name: /Selecionar idioma/ });
  await language.focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(language).toBeFocused();
  await language.click();
  await page.mouse.click(500, 160);
  await expect(page.getByRole('menu')).toHaveCount(0);
  const before = await header(page).boundingBox();
  await page.evaluate(() => scrollTo(0, 1500));
  await expect(header(page)).toHaveAttribute('data-scrolled', 'true');
  expect(await header(page).boundingBox()).toEqual(before);
  await expect(header(page).getByRole('link', { name: 'Entrar', exact: true })).toHaveAttribute('href', '/portal/acesso');
  await expect(header(page).getByRole('link', { name: 'Conversar no WhatsApp', exact: true })).toHaveAttribute('href', /wa.me|api.whatsapp.com/);
  await header(page).getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/acesso/);
});

test('cold rendering and first menu frames under CPU/network throttling', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP throttling is Chromium-specific');
  test.setTimeout(120000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: 500000, uploadThroughput: 250000 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    const samples: object[] = [];
    (window as unknown as { headerFrames: object[] }).headerFrames = samples;
    const sample = () => {
      const h = document.querySelector('header[data-header-state]');
      if (h && samples.length < 120) {
        const s = getComputedStyle(h);
        if (s.position === 'fixed') {
          const r = h.getBoundingClientRect();
          samples.push({ filter: s.backdropFilter, x: r.x, width: r.width, height: r.height });
        }
      }
      if (samples.length < 120) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await expect(header(page)).toBeVisible();
  await header(page).getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const samples = await page.locator('#mobile-navigation').evaluate(async dialog => {
    const panel = dialog.querySelector('[data-navigation-glass="panel"]')!;
    const frames = [];
    for (let i = 0; i < 18; i++) {
      const s = getComputedStyle(panel);
      frames.push({ filter: s.backdropFilter, background: s.backgroundColor, opacity: s.opacity });
      await new Promise(requestAnimationFrame);
    }
    return frames;
  });
  expect(samples.every(s => s.filter.includes('blur(18px)') && s.background !== 'rgba(0, 0, 0, 0)')).toBe(true);
  const initial = await page.evaluate(() => (window as unknown as { headerFrames: { filter: string; x: number; width: number; height: number }[] }).headerFrames);
  expect(initial.length).toBeGreaterThan(0);
  expect(initial.every(f => f.filter.includes('blur(18px)') && f.x === initial[0].x && f.width === initial[0].width && f.height === initial[0].height)).toBe(true);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  await cdp.detach();
});

test('reduced motion retains glass and usable controls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 360, height: 640 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 30000 });
  await header(page).getByRole('button', { name: 'Abrir menu', exact: true }).click();
  const panel = page.locator('#mobile-navigation [data-navigation-glass="panel"]');
  expect(await panel.evaluate(e => getComputedStyle(e).transitionDuration)).toBe('0s');
  await page.keyboard.press('Escape');
  await expect(page.locator('#mobile-navigation')).not.toBeVisible();
});
