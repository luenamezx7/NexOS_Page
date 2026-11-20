import { expect, test } from '@playwright/test';

test('a rejected password shakes again on retry and clears while editing', async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' } }));
  await page.goto('/portal/acesso');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  const password = page.getByLabel('Senha', { exact: true });
  await password.fill('wrong-password');
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(password).toHaveAttribute('aria-invalid', 'true');
    await expect(password).toHaveClass(/is-shaking/);
    await expect(page.locator('[data-slot="alert"]')).toBeVisible();
  }
  await password.fill('correcting-password');
  await expect(password).not.toHaveClass(/is-shaking/);
  await expect(password).not.toHaveAttribute('aria-invalid', 'true');
});

test('reduced motion keeps password feedback visible without shaking', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' } }));
  await page.goto('/portal/acesso');
  await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
  const password = page.getByLabel('Senha', { exact: true });
  await password.fill('wrong-password');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(password).toHaveAttribute('aria-invalid', 'true');
  await expect(password).toHaveCSS('animation-name', 'none');
  await expect(page.locator('[data-slot="alert"]')).toBeVisible();
});
