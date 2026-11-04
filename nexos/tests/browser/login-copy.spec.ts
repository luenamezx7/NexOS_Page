import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('login and account recovery describe access instead of orders', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/portal/acesso');
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
  await expect(page.locator('main')).toContainText('Acesso protegido');
  await page.getByRole('button', { name: 'Esqueceu a senha?' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
});
