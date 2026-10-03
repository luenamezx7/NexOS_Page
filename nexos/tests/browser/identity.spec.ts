import { test, expect, type Page } from '@playwright/test';

async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.addInitScript(theme => {
    localStorage.setItem('nexos-theme', theme);
    sessionStorage.setItem('nexos-boot-seen', '1');
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, theme);
}

const publicRoutes = ['/portal/acesso', '/admin-dashboard-su/secure-entry', '/portal/redefinir', '/portal/redefinir?token=identity-test', '/termos', '/privacidade', '/cookies', '/lgpd', '/reembolso', '/cancelado', '/sucesso', '/missing-identity-test'];

for (const theme of ['light', 'dark'] as const) {
  test(`${theme}: every public screen inherits cream/OLED and stars without mobile overflow`, async ({ page }) => {
    test.setTimeout(60000);
    await setTheme(page, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
    for (const route of publicRoutes) {
      await page.goto(route);
      await expect(page.locator(theme === 'dark' ? '.site-atmosphere canvas' : '.site-atmosphere .day-clouds')).toBeVisible();
      await expect(page.locator('body')).toHaveCSS('background-color', theme === 'dark' ? 'rgb(0, 0, 0)' : 'rgb(243, 234, 217)');
      for (const width of [320, 768, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} at ${width}px`).toBe(true);
      }
    }
  });
}

test('white hero stars cover the left edge and stop twinkling under reduced motion', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const canvas = page.locator('.hero-flow canvas');
  await expect(canvas).toBeVisible();
  const counts = await canvas.evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = 0, right = 0, white = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      if (pixels[i + 3] < 30) continue;
      const x = (i / 4) % canvas.width;
      if (x < canvas.width / 4) left++;
      if (x > canvas.width * 3 / 4) right++;
      if (pixels[i] > 245 && pixels[i + 1] > 245 && pixels[i + 2] > 245) white++;
    }
    return { left, right, white };
  });
  expect(counts.left).toBeGreaterThan(100);
  expect(counts.left / counts.right).toBeGreaterThan(0.55);
  expect(counts.white).toBeGreaterThan(100);
  const before = await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL());
  await page.waitForTimeout(300);
  expect(await canvas.evaluate(element => (element as HTMLCanvasElement).toDataURL())).toBe(before);
});

test('dark sky responds with ASCII flow while cream mode displays clouds and pauses stars', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const stars = page.locator('.hero-flow canvas');
  await expect(stars).toBeVisible();
  await expect(stars).toHaveAttribute('data-ascii-flow', 'idle');
  await page.mouse.move(100, 240);
  await expect(stars).toHaveAttribute('data-ascii-flow', 'active');
  await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerleave')));
  await expect(stars).toHaveAttribute('data-ascii-flow', 'idle');
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await expect(page.locator('.site-atmosphere .day-clouds')).toBeVisible();
  await expect(stars).toBeHidden();
  await expect(page.locator('.site-atmosphere canvas')).toBeHidden();
});

test('metallic login submit preserves validation, keyboard activation and disabled state', async ({ page }) => {
  await setTheme(page, 'light');
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  let submissions = 0;
  await page.route('**/api/auth/sign-in/email', route => {
    submissions++;
    return route.fulfill({ status: 400, json: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' } });
  });
  await page.goto('/portal/acesso');
  const submit = page.getByRole('button', { name: 'Entrar', exact: true });
  await expect(submit.locator('[data-metallic-surface]')).toHaveCount(1);
  await submit.click();
  expect(submissions).toBe(0);
  await page.getByLabel('E-mail', { exact: true }).fill('identity@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('incorrect-password');
  await submit.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => submissions).toBe(1);
  await expect(submit).toBeEnabled();
  await page.route('**/api/security/config', route => route.fulfill({ status: 503, json: {} }));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeDisabled();
});

test('light password fields stay cream on focus, entry and a dark-to-light theme switch', async ({ page }) => {
  await setTheme(page, 'light');
  await page.goto('/portal/acesso');
  const password = page.getByLabel('Senha', { exact: true });
  await password.fill('visual-test-password');
  await expect(password).toHaveCSS('background-color', 'rgb(234, 223, 205)');
  await expect(password).toHaveCSS('-webkit-text-fill-color', 'rgb(36, 30, 39)');
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await page.getByRole('button', { name: 'Ativar modo claro' }).click();
  await password.focus();
  await expect(password).toHaveCSS('background-color', 'rgb(234, 223, 205)');
  await expect(password).toHaveCSS('color-scheme', /^(only light|light only)$/);
});

test('hero heading and actions are horizontally centered on desktop and mobile', async ({ page }) => {
  await setTheme(page, 'dark');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const width of [360, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const selector of ['.hero-copy', '.hero-actions']) {
      const bounds = await page.locator(selector).boundingBox();
      expect(Math.abs(bounds!.x + bounds!.width / 2 - width / 2)).toBeLessThan(2);
    }
    const button = await page.getByRole('button', { name: 'Iniciar Projeto', exact: true }).boundingBox();
    if (width < 768) expect(Math.abs(button!.x + button!.width / 2 - width / 2)).toBeLessThan(2);
  }
});

test('light-only Dither Wave uses pink and cream instead of black pixels', async ({ page }) => {
  await setTheme(page, 'light');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/portal/acesso');
  const wave = page.locator('[data-dither-wave="local"] canvas');
  await expect(wave).toBeVisible();
  const colors = await wave.evaluate(element => {
    const canvas = element as HTMLCanvasElement;
    const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data;
    let cream = 0, pink = 0, black = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 243 && data[i + 1] === 234 && data[i + 2] === 217) cream++;
      else if (data[i] > 180 && data[i] > data[i + 1] * 2) pink++;
      if (data[i] + data[i + 1] + data[i + 2] < 30) black++;
    }
    return { cream, pink, black };
  });
  expect(colors.cream).toBeGreaterThan(100);
  expect(colors.pink).toBeGreaterThan(100);
  expect(colors.black).toBe(0);
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('[data-dither-wave]')).toHaveCount(0);
});
