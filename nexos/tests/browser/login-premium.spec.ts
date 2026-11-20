import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const review = resolve('.impeccable/review');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
});

for (const width of [390, 820, 1440]) {
  test(`login visual review at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/portal/acesso');
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator('section[aria-labelledby="login-title"]')).toHaveAttribute('data-reveal-state', 'visible');
    await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
    if (process.env.LOGIN_CAPTURE_STAGE !== 'before') await expect(page.locator('#main-content')).toHaveCSS('opacity', '1');
    await expect(page.getByRole('banner')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    mkdirSync(review, { recursive: true });
    await page.screenshot({ path: resolve(review, `login-${process.env.LOGIN_CAPTURE_STAGE || 'after'}-${width}.png`), fullPage: true });
  });
}

test('password visibility preserves the native input, focus, value and caret', async ({ page }) => {
  await page.goto('/portal/acesso');
  const email = page.getByLabel('E-mail', { exact: true });
  const password = page.getByLabel('Senha', { exact: true });
  await email.fill('person@example.com');
  await email.press('Tab');
  await expect(password).toBeFocused();
  await password.fill('correct-horse-123');
  await password.evaluate(input => { input.dataset.originalInput = 'yes'; (input as HTMLInputElement).setSelectionRange(3, 8); });
  await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toBeFocused();
  expect(await password.evaluate(input => [(input as HTMLInputElement).selectionStart, (input as HTMLInputElement).selectionEnd])).toEqual([3, 8]);
  await expect(password).toHaveValue('correct-horse-123');
  await expect(password).toHaveAttribute('data-original-input', 'yes');
  await page.getByRole('button', { name: 'Ocultar senha', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  await expect(password).toBeFocused();
  await password.press('Tab');
  await expect(page.getByRole('button', { name: 'Mostrar senha', exact: true })).toBeFocused();
  await page.keyboard.press('Space');
  await expect(password).toHaveAttribute('type', 'text');
  await expect(page.getByRole('button', { name: 'Ocultar senha', exact: true })).toBeFocused();
});

test('Caps Lock is announced without moving the password field', async ({ page }) => {
  await page.goto('/portal/acesso');
  const password = page.getByLabel('Senha', { exact: true });
  await password.focus();
  await expect(page.locator('#main-content')).toHaveCSS('opacity', '1');
  const before = await password.boundingBox();
  await password.dispatchEvent('keydown', { key: 'A', code: 'KeyA', modifierCapsLock: true });
  await expect(page.locator('#login-caps-lock')).toContainText('Caps Lock ativado');
  expect(await password.boundingBox()).toEqual(before);
  await password.blur();
  await expect(page.locator('#login-caps-lock')).toBeEmpty();
});

test('invalid credentials shake once per rejection, retain input and keep layout stable', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/auth/sign-in/email', async route => {
    calls++;
    await new Promise(resolve => setTimeout(resolve, 200));
    await route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' } });
  });
  await page.goto('/portal/acesso');
  const email = page.getByLabel('E-mail', { exact: true });
  const password = page.getByLabel('Senha', { exact: true });
  const submit = page.getByRole('button', { name: 'Entrar', exact: true });
  const form = page.locator('form[data-credential-rejected]');
  await email.fill('person@example.com');
  await password.fill('incorrect-password');
  await expect(page.locator('#main-content')).toHaveCSS('opacity', '1');
  const before = await submit.boundingBox();
  for (let attempt = 1; attempt <= 2; attempt++) {
    await password.press('Enter');
    await expect(submit).toHaveAttribute('aria-busy', 'true');
    await expect(password).toHaveAttribute('readonly');
    await expect(password).toBeFocused();
    await password.press('Enter');
    await expect(form).toHaveAttribute('data-credential-rejected', 'true');
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
    const shake = await form.evaluate(element => {
      const animation = element.getAnimations().find(animation => (animation as CSSAnimation).animationName?.includes('auth-credential-shake'));
      if (!animation) return null;
      animation.pause();
      const samples = [0, 58, 115, 173, 230, 282, 320].map(time => {
        animation.currentTime = time;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return { x: matrix.m41, y: matrix.m42 };
      });
      animation.finish();
      return { duration: animation.effect!.getTiming().duration, samples };
    });
    expect(shake).not.toBeNull();
    expect(shake!.duration).toBe(320);
    expect(shake!.samples.every(sample => Math.abs(sample.x) <= 6 && sample.y === 0)).toBe(true);
    expect(shake!.samples.at(-1)!.x).toBeCloseTo(0, 2);
    await expect(email).toHaveValue('person@example.com');
    await expect(password).toHaveValue('incorrect-password');
    await expect(submit).toBeEnabled();
    expect(calls).toBe(attempt);
    const after = await submit.boundingBox();
    expect(after!.width).toBeCloseTo(before!.width, 1);
    expect(after!.y).toBeCloseTo(before!.y, 1);
  }
  await password.fill('correcting');
  await expect(form).toHaveAttribute('data-credential-rejected', 'false');
  await expect(password).not.toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const status of [429, 500, 503]) {
  test(`HTTP ${status} restores controls without shaking or leaking server messages`, async ({ page }) => {
    await page.route('**/api/auth/sign-in/email', route => route.fulfill({ status, json: { code: status === 429 ? 'TOO_MANY_REQUESTS' : 'INTERNAL_SERVER_ERROR', message: 'postgres secret database failure' } }));
    await page.goto('/portal/acesso');
    await page.getByLabel('E-mail', { exact: true }).fill('person@example.com');
    await page.getByLabel('Senha', { exact: true }).fill('password-123');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText(status === 429 ? 'Muitas tentativas' : 'temporariamente indisponível');
    await expect(page.locator('form[data-credential-rejected]')).toHaveAttribute('data-credential-rejected', 'false');
    await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
    await expect(page.getByRole('alert')).not.toContainText(/postgres|secret|database/);
  });
}

test('offline failure recovers without a credential shake', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email', route => route.abort('internetdisconnected'));
  await page.goto('/portal/acesso');
  await page.getByLabel('E-mail', { exact: true }).fill('person@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('password-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Conexão indisponível');
  await expect(page.locator('form[data-credential-rejected]')).toHaveAttribute('data-credential-rejected', 'false');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeEnabled();
});

test('empty or malformed fields never submit credentials', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/auth/sign-in/email', route => { calls++; return route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD' } }); });
  await page.goto('/portal/acesso');
  await expect(page.getByLabel('E-mail', { exact: true })).not.toBeFocused();
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByLabel('E-mail', { exact: true })).toBeFocused();
  await page.getByLabel('E-mail', { exact: true }).fill('invalid-email');
  await page.getByLabel('Senha', { exact: true }).fill('password-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  expect(calls).toBe(0);
  expect(await page.getByLabel('E-mail', { exact: true }).evaluate(input => (input as HTMLInputElement).validity.typeMismatch)).toBe(true);
});

test('reduced motion retains accessible static error feedback', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD' } }));
  await page.goto('/portal/acesso');
  await page.getByLabel('E-mail', { exact: true }).fill('person@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('password-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('E-mail ou senha incorretos');
  await expect(page.locator('form[data-credential-rejected]')).toHaveCSS('animation-name', 'none');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute('aria-describedby', 'login-feedback');
});

test('successful credentials preserve the sanitized callback and navigate immediately', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ json: { user: { id: 'ui-fixture', email: 'person@example.com' } } }));
  await page.route('**/conta?section=security', route => route.fulfill({ contentType: 'text/html', body: '<main><h1>Destino autenticado de teste</h1></main>' }));
  await page.goto('/portal/acesso?callbackUrl=%2Fconta%3Fsection%3Dsecurity');
  await page.getByLabel('E-mail', { exact: true }).fill('person@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('password-123');
  await page.getByLabel('Senha', { exact: true }).press('Enter');
  await expect(page).toHaveURL(/\/conta\?section=security$/);
  await expect(page.getByRole('heading', { name: 'Destino autenticado de teste' })).toBeVisible();
});
