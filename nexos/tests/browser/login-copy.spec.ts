import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('login and account recovery describe access instead of orders', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/portal/acesso');
  const header = page.locator('section[aria-labelledby="login-title"]');
  await expect(page.getByRole('banner')).toHaveCount(0);
  await expect(header.getByRole('navigation', { name: 'Navegação de páginas' })).toHaveCount(0);
  await expect(header.getByRole('link', { name: /voltar ao site/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Entrar na sua conta' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
  await expect(page.locator('main')).not.toContainText('Conhecer as soluções');
  await expect(page.locator('main')).not.toContainText('Seu espaço.');
  await expect(page.locator('main')).not.toContainText('Seu acesso.');
  await expect(page.locator('main aside')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Criar conta', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Esqueceu a senha?' }).click();
  await expect(page.getByRole('heading', { name: 'Recuperar senha' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/pedidos/i);
  await expect(header.getByRole('navigation', { name: 'Navegação de páginas' })).toHaveCount(0);
});

for (const path of ['/portal/acesso', '/admin-dashboard-su/secure-entry']) {
  test(`login identity has only branding and a home link on ${path}`, async ({ page }, testInfo) => {
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    for (const width of [320, 1366]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expect(page.getByRole('banner')).toHaveCount(0);
      const identity = page.locator(path === '/portal/acesso' ? 'section[aria-labelledby="login-title"]' : '[data-auth-identity]');
      await expect(identity.locator('img[src="/logo-ghost.svg"]')).toBeVisible();
      await expect(identity.getByRole('link', { name: 'ezway — página inicial' })).toBeVisible();
      await expect(identity.getByRole('link', { name: 'Voltar ao site' })).toHaveAttribute('href', '/');
      await expect(identity.getByRole('link', { name: 'Voltar ao site' })).toBeVisible();
      await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('section[aria-labelledby="login-title"]')).toHaveAttribute('data-reveal-state', 'visible');
      await page.screenshot({ path: testInfo.outputPath(`login-${width}.png`) });
    }
    await page.getByRole('link', { name: 'Voltar ao site', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });
}
