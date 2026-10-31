import { test, expect, type Page } from '@playwright/test';

async function openHome(page: Page, theme?: 'dark' | 'light') {
  await page.addInitScript(theme => {
    if (theme) localStorage.setItem('nexos-theme', theme);
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, theme);
  await page.goto('/');
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#hero-title')).toBeVisible();
}

test('real guest session, dark default, nine experiences and usable navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  const session = await page.request.get('/api/auth/get-session');
  expect(await session.json()).toBeNull();
  await openHome(page);
  await expect(page.locator('html')).toHaveClass(/dark/);
  const header = page.getByRole('banner');
  const guest = header.getByRole('link', { name: 'Minha conta', exact: true });
  await expect(guest).toHaveAttribute('href', '/portal/acesso');
  await expect(guest.locator('svg,[data-slot="avatar"]')).toHaveCount(0);
  await expect(page.locator('[data-home-experience]')).toHaveCount(9);
  await expect(page.locator('#metrics')).toHaveCount(0);
  await expect(page.locator('[data-hero-brand-strip]')).toHaveCount(1);
  await header.getByRole('button', { name: 'Soluções', exact: true }).click();
  await expect(page.getByRole('menuitem', { name: 'Sites e Portfólios' })).toHaveAttribute('href', '/criacao-de-sites');
  await page.keyboard.press('Escape');
  await expect(header.getByRole('button', { name: 'Soluções', exact: true })).toBeFocused();
  await header.getByRole('link', { name: 'EasyWay' }).click();
  await expect(page).toHaveURL(/#easyway$/);
  await expect(header).toHaveAttribute('data-scrolled', 'true');
  await expect(page.locator('#easyway')).toContainText('Nome provisório. Interface conceitual.');
  await header.getByRole('link', { name: 'Sobre Nós' }).click();
  await expect(page.locator('.landing-header-blur')).toHaveCSS('pointer-events', 'none');
  await expect(page.locator('.landing-edge-blur')).toHaveCSS('pointer-events', 'none');
  const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!).filter(href => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(broken).toEqual([]);
});

test('session loading, authenticated image/fallback, keyboard menu and logout errors', async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  let signedOut = false;
  const fixture = { user: { id: 'ui-fixture', name: 'Cliente NexOS', email: 'ui@example.test', emailVerified: true, image: '/favicon.png', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, session: { id: 'ui-session', userId: 'ui-fixture', token: 'ui-only', expiresAt: '2099-01-01T00:00:00.000Z', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } };
  await page.route('**/api/auth/get-session', async route => { await wait; await route.fulfill({ json: signedOut ? null : fixture }); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await expect(page.locator('header [data-account-state]')).toHaveAttribute('data-account-state', 'loading');
  await expect(page.locator('header').getByRole('link', { name: 'Minha conta', exact: true })).toHaveCount(0);
  release();
  const trigger = page.getByRole('button', { name: 'Abrir opções da conta' });
  await expect(trigger.locator('img')).toHaveAttribute('src', '/favicon.png');
  await trigger.focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: 'Segurança da conta' })).toHaveAttribute('href', '/portal/seguranca');
  await page.route('**/api/auth/sign-out', route => route.fulfill({ status: 503, json: { message: 'Unavailable' } }));
  await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível sair' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await page.unroute('**/api/auth/sign-out');
  await page.route('**/api/auth/sign-out', route => { signedOut = true; return route.fulfill({ json: { success: true } }); });
  await trigger.click(); await page.getByRole('menuitem', { name: 'Sair da conta' }).click();
  await expect(page).toHaveURL(/\/portal\/acesso$/);
});

test('mobile modal traps focus, exposes guest text and restores scroll before anchors', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Explore a NexOS' });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('link', { name: 'Minha conta', exact: true })).toHaveAttribute('href', '/portal/acesso');
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab');
    expect(await menu.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(menu).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeFocused();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await menu.getByRole('link', { name: 'EasyWay', exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page).toHaveURL(/#easyway$/);
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  await expect.poll(() => page.locator('#easyway').evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)))).toBeLessThan(5);
});

test('marquee moves, pauses on hover and keyboard control, then becomes static under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openHome(page, 'dark');
  await expect(page.locator('#hero-title [data-reveal-word="Soluções"] [data-blur-letter]').first()).toHaveCSS('background-image', /linear-gradient/);
  await expect(page.locator('#hero-title [data-reveal-word="IA"] [data-blur-letter]').first()).toHaveCSS('background-image', /linear-gradient/);
  const track = page.locator('[data-marquee-track]');
  await expect(track).toHaveCSS('animation-duration', '32s');
  const initial = await track.evaluate(el => getComputedStyle(el).transform);
  await expect.poll(() => track.evaluate(el => getComputedStyle(el).transform)).not.toBe(initial);
  await page.locator('[data-hero-brand-strip]').hover();
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await page.mouse.move(0, 0);
  const pause = page.getByRole('button', { name: 'Pausar faixa' });
  await pause.focus(); await page.keyboard.press('Enter');
  await expect(track).toHaveCSS('animation-play-state', 'paused');
  await expect(page.getByRole('button', { name: 'Retomar faixa' })).toHaveAttribute('aria-pressed', 'true');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(track).toHaveCSS('animation-name', 'none');
  await expect(page.locator('[data-hero-brand-strip] [aria-hidden="true"][inert]')).toBeHidden();
  await expect(page.locator('[data-hero-brand-strip]')).not.toContainText('IA aplicada');
});

for (const theme of ['dark', 'light'] as const) {
  test(`${theme}: six responsive widths, service interactions and globe`, async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await openHome(page, theme);
    for (const width of [375, 430, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
      await page.locator('#hero').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow @${width}`).toBe(true);
      const heading = await page.locator('#hero-title').boundingBox();
      expect(heading!.x).toBeGreaterThanOrEqual(0);
      expect(heading!.x + heading!.width).toBeLessThanOrEqual(width);
      expect(Math.abs(heading!.x + heading!.width / 2 - width / 2)).toBeLessThan(2);
      await expect(page.locator('#hero-title [data-reveal-word="Soluções"]')).toHaveCSS('background-image', /linear-gradient/);
      await expect(page.locator('#hero-title [data-reveal-word="IA"]')).toHaveCSS('background-image', /linear-gradient/);
      await expect(page.getByRole('link', { name: 'Explorar soluções', exact: true }).first()).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath(`hero-${theme}-${width}.png`) });
      for (const id of ['services', 'easyway', 'showcase', 'mascot-solutions', 'testimonials', 'faq', 'cta-final']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${id} @${width}`).toBe(true);
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('#services').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Quero vender' }).check();
    await expect(page.locator('#services')).toContainText('2 soluções para vender');
    await page.getByRole('button', { name: 'Pratos', exact: true }).click();
    await expect(page.locator('#services')).toContainText('Massa artesanal');
    await page.getByRole('radio', { name: 'Explorar tudo' }).check();
    await page.locator('#services').screenshot({ path: testInfo.outputPath(`solutions-${theme}.png`) });
    await page.locator('#easyway').screenshot({ path: testInfo.outputPath(`easyway-${theme}.png`) });
    await page.locator('#testimonials').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-globe-state]')).toHaveAttribute('data-globe-state', /ready|unavailable/, { timeout: 15000 });
    await expect(page.locator('#testimonials img')).toHaveCount(0);
    await page.locator('#testimonials').screenshot({ path: testInfo.outputPath(`about-${theme}.png`) });
    if (await page.locator('[data-globe-state]').getAttribute('data-globe-state') === 'ready') {
      const globe = page.locator('#testimonials canvas');
      const before = (await globe.screenshot()).toString('base64');
      await page.getByRole('button', { name: 'Girar globo para a esquerda' }).click();
      await expect.poll(async () => (await globe.screenshot()).toString('base64') !== before).toBe(true);
    }
    expect(errors).toEqual([]);
  });
}

test('OLED, vivid violet and citron action retain readable focus and hover contrast', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page, 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)');
  const action = page.getByRole('link', { name: 'Explorar soluções', exact: true }).first();
  await expect(action).toHaveCSS('background-color', 'rgb(216, 239, 112)');
  await action.hover();
  await expect(action).toHaveCSS('color', 'rgb(32, 38, 10)');
  await action.focus();
  await expect(action).toHaveCSS('color', 'rgb(32, 38, 10)');
});
