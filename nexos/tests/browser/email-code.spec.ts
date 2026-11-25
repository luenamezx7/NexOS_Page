import { expect, test, type Page } from '@playwright/test';

async function openChallenge(page: Page) {
  await page.goto('/portal/acesso?callbackUrl=%2Fconta%3Fsection%3Dsecurity');
  await page.getByRole('button', { name: 'Entrar com código por e-mail', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('member@example.test');
  await page.getByRole('button', { name: 'Enviar código de verificação', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Código de verificação', exact: true })).toBeVisible();
}
const cell = (page: Page, index: number) => page.getByRole('textbox', { name: `Código de verificação, dígito ${index} de 6`, exact: true });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/auth/email-otp/send-verification-otp', route => route.fulfill({ json: { success: true } }));
});

test('email OTP checks on the server and only then follows the sanitized destination', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/auth/sign-in/email-otp', async route => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({ email: 'member@example.test', otp: '204815' });
    await route.fulfill({ json: { token: 'ui-fixture', user: { id: 'ui-fixture' } } });
  });
  await page.route('**/conta?section=security', route => route.fulfill({ contentType: 'text/html', body: '<main><h1>Conta de teste autorizada</h1></main>' }));
  await openChallenge(page);
  expect(calls).toBe(0);
  for (let index = 1; index <= 5; index++) await cell(page, index).fill('20481'[index - 1]);
  expect(calls).toBe(0);
  await cell(page, 6).fill('5');
  await expect(page).toHaveURL(/\/conta\?section=security$/);
  await expect(page.getByRole('heading', { name: 'Conta de teste autorizada' })).toBeVisible();
  expect(calls).toBe(1);
});

test('invalid codes retain the challenge, announce an error, and allow correction', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email-otp', route => route.fulfill({ status: 400, json: { code: 'INVALID_OTP' } }));
  await openChallenge(page);
  await cell(page, 1).fill('000000');
  await expect(page.locator('[data-otp-input]')).toHaveAttribute('data-otp-status', 'error');
  await expect(cell(page, 1)).toBeFocused();
  await expect(cell(page, 1)).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Código inválido' })).toBeVisible();
  await expect(page).toHaveURL(/portal\/acesso/);
  await cell(page, 1).press('Backspace');
  await expect(page.locator('[data-otp-input]')).toHaveAttribute('data-otp-status', 'idle');
});

test('paste, arrows, delete and changing email work at 320px without overflow', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/auth/sign-in/email-otp', route => route.fulfill({ status: 400, json: { code: 'INVALID_OTP' } }));
  await openChallenge(page);
  await cell(page, 1).evaluate(input => {
    const data = new DataTransfer(); data.setData('text/plain', '20x48-15');
    input.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  await expect(page.locator('[data-otp-input]')).toHaveAttribute('data-otp-status', 'error');
  await expect(cell(page, 1)).toHaveValue('2');
  await cell(page, 1).press('ArrowRight'); await expect(cell(page, 2)).toBeFocused();
  await cell(page, 2).press('Delete'); await expect(cell(page, 2)).toHaveValue('');
  await cell(page, 2).press('Backspace'); await expect(cell(page, 1)).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.screenshot({ path: info.outputPath('email-code-320.png'), fullPage: true });
  await page.getByRole('button', { name: 'Usar outro e-mail', exact: true }).click();
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
  await expect(page.locator('[data-otp-input]')).toHaveCount(0);
});

test('MFA remains a separate required step after an accepted email code', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email-otp', route => route.fulfill({ json: { twoFactorRedirect: true } }));
  await openChallenge(page);
  await cell(page, 1).fill('204815');
  await expect(page.getByRole('heading', { name: 'Verificação em duas etapas' })).toBeVisible();
  await expect(page.getByLabel('Código do autenticador', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/portal\/acesso/);
});

test('resend cooldown prevents duplicate sends and keeps the email', async ({ page }) => {
  let sends = 0;
  await page.route('**/api/auth/email-otp/send-verification-otp', route => { sends++; return route.fulfill({ json: { success: true } }); });
  await page.clock.install();
  await openChallenge(page);
  await expect(page.getByRole('button', { name: /Reenviar em/ })).toBeDisabled();
  expect(sends).toBe(1);
  await page.clock.fastForward(61000);
  // Timers deliberately tick once per elapsed second; runFor exercises the countdown.
  await page.clock.runFor(61000);
  await page.getByRole('button', { name: 'Reenviar código', exact: true }).click();
  expect(sends).toBe(2);
  await expect(page.getByText('member@example.test', { exact: true })).toBeVisible();
});

test('send failure leaves a recoverable form without claiming a code was sent', async ({ page }) => {
  await page.route('**/api/auth/email-otp/send-verification-otp', route => route.fulfill({ status: 503, json: { code: 'EMAIL_UNAVAILABLE' } }));
  await page.goto('/portal/acesso');
  await page.getByRole('button', { name: 'Entrar com código por e-mail', exact: true }).click();
  await page.getByLabel('E-mail', { exact: true }).fill('member@example.test');
  await page.getByRole('button', { name: 'Enviar código de verificação', exact: true }).click();
  await expect(page.locator('[data-slot="alert"]')).toContainText('temporariamente indisponível');
  await expect(page.getByRole('button', { name: 'Enviar código de verificação' })).toBeEnabled();
  await expect(page.locator('[data-otp-input]')).toHaveCount(0);
});
