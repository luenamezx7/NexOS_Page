import { test, expect } from '@playwright/test';

const retired = [
  { path: '/criacao-de-sites', destination: '/#services', label: 'Criação de sites', target: '#services' },
  { path: '/placa-nfc', destination: '/#showcase', label: 'Placa NFC + QR Code', target: '#showcase' },
  { path: '/cardapio-digital', destination: '/#services', label: 'Cardápio digital', target: '#services' },
  { path: '/landing-pages', destination: '/#services', label: 'Landing pages', target: '#services' },
];

test('retired pages redirect to home sections and leave the sitemap', async ({ request, baseURL }) => {
  for (const { path, destination } of retired) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(new URL(response.headers().location, baseURL).pathname + new URL(response.headers().location, baseURL).hash).toBe(destination);
  }
  const response = await request.get('/sitemap.xml');
  expect(response.ok()).toBe(true);
  const xml = await response.text();
  for (const { path } of retired) expect(xml).not.toContain(path);
  expect(xml).toContain('<loc>');
  expect((await request.get('/portal/acesso')).ok()).toBe(true);
});

test('home links reach the existing product sections instead of retired pages', async ({ page }) => {
  test.setTimeout(60000);
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  for (const { path, destination, label, target } of retired) {
    await expect(page.locator(`a[href="${path}"]`)).toHaveCount(0);
    const link = page.locator('footer').getByRole('link', { name: label, exact: true });
    await expect(link).toHaveAttribute('href', destination);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeInViewport({ timeout: 15000 });
  }
});

for (const width of [390, 1440]) {
  test(`header has direct navigation without the solutions tree at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByRole('banner').getByRole('button', { name: 'Soluções', exact: true })).toHaveCount(0);
    if (width < 1200) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    const navigation = page.getByRole('navigation', { name: width < 1200 ? 'Navegação móvel' : 'Navegação principal' });
    await expect(navigation.getByRole('button', { name: 'Serviços', exact: true })).toHaveCount(0);
    await expect(navigation.locator('[data-slot="dropdown-menu-trigger"], details, #mobile-services')).toHaveCount(0);
    for (const label of ['Gestão', 'Ecossistema', 'Placas', 'EasyChat']) await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
    if (width < 1200) await page.keyboard.press('Escape');
  });
}
