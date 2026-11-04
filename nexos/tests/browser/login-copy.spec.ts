import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('login and account recovery describe access instead of orders', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/portal/acesso');
  const header = page.locator('header[data-page-header]');
  await expect(header.getByRole('navigation', { name: 'Navegação de páginas' })).toHaveCount(0);
  await expect(header.getByRole('link', { name: /voltar ao site/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
  await expect(page.locator('main')).not.toContainText('Conhecer as soluções');
  await expect(page.locator('main')).toContainText('Acesso protegido');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Criar sua conta' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar', exact: true }).first().click();
  await page.getByRole('button', { name: 'Esqueceu a senha?' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
  await expect(header.getByRole('navigation', { name: 'Navegação de páginas' })).toHaveCount(0);
});
