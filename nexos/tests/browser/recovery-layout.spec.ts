import { expect, test } from '@playwright/test';

for (const width of [320, 390, 932, 1440]) {
  test(`Silk recovery keeps one centered panel across form, success and missing link at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    let submissions = 0;
    await page.route('**/api/auth/reset-password', async route => {
      expect(route.request().postDataJSON().token).toBe('layout-fixture');
      submissions++;
      await route.fulfill({ json: { status: true } });
    });
    await page.goto('/portal/redefinir?token=layout-fixture');
    await expect(page.getByRole('heading', { name: 'Defina nova senha' })).toBeVisible();
    const checkLayout = async () => {
      await expect(page.locator('[data-silk-background]')).toHaveAttribute('data-silk-state', 'static');
      await expect(page.getByRole('banner')).toHaveCount(0);
      await expect(page.getByRole('contentinfo')).toHaveCount(0);
      await expect(page.locator('main aside')).toHaveCount(0);
      const geometry = await page.locator('section[aria-labelledby] > div').evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const frame = document.querySelector('[data-silk-frame]')!.getBoundingClientRect();
        const logo = element.querySelector('a[aria-label="ezway — página inicial"]')!.getBoundingClientRect();
        return { center: bounds.x + bounds.width / 2, frameCenter: frame.x + frame.width / 2, logoCenter: logo.x + logo.width / 2, vertical: bounds.y + bounds.height / 2, frameVertical: frame.y + frame.height / 2, inset: parseFloat(getComputedStyle(element).paddingLeft), width: bounds.width, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.width).toBeLessThanOrEqual(480);
      expect(geometry.inset).toBeGreaterThanOrEqual(18);
      expect(Math.abs(geometry.center - geometry.frameCenter)).toBeLessThan(1);
      expect(Math.abs(geometry.vertical - geometry.frameVertical)).toBeLessThan(1);
      expect(Math.abs(geometry.logoCenter - geometry.frameCenter)).toBeLessThan(1);
    };
    await checkLayout();
    await page.screenshot({ path: info.outputPath('recovery-form.png'), fullPage: true });
    await page.getByLabel('Nova senha', { exact: true }).fill('Layout-Password-12345!');
    await page.getByRole('button', { name: 'Mostrar senha', exact: true }).click();
    await expect(page.getByLabel('Nova senha', { exact: true })).toHaveAttribute('type', 'text');
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Layout-Password-12345!');
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation', 'success');
    await expect(page).toHaveURL('/portal/acesso');
    expect(submissions).toBe(1);
    await page.goto('/portal/redefinir');
    await expect(page.getByRole('heading', { name: 'Link necessário' })).toBeVisible();
    await checkLayout();
    await page.screenshot({ path: info.outputPath('recovery-missing-link.png'), fullPage: true });
  });
}

test('invalid recovery links retain the same glass panel and allow returning to login', async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.route('**/api/auth/reset-password', route => route.fulfill({ status: 400, json: { code: 'INVALID_TOKEN', message: 'Invalid token' } }));
  await page.goto('/portal/redefinir?token=expired-fixture');
  await page.getByLabel('Nova senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Test-Password-12345!');
  await page.getByRole('button', { name: 'Salvar nova senha' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'expirou ou já foi usado' })).toBeVisible();
  await expect(page.locator('[data-client-portal]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Salvar nova senha' })).toBeEnabled();
  await page.screenshot({ path: info.outputPath('recovery-invalid-link.png'), fullPage: true });
  await page.getByRole('link', { name: 'Voltar ao login', exact: true }).click();
  await expect(page).toHaveURL('/portal/acesso');
});
