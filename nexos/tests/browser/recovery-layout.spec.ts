import { expect, test } from '@playwright/test';

for (const width of [320, 390, 932, 1440]) {
  test(`recovery form and confirmation retain card insets and page footer at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    let submissions = 0;
    await page.route('**/api/auth/reset-password', async route => {
      expect(route.request().postDataJSON().token).toBe('layout-fixture');
      submissions++;
      await route.fulfill({ json: { status: true } });
    });
    await page.goto('/portal/redefinir?token=layout-fixture');
    const section = page.locator('section[aria-labelledby="reset-title"]');
    const card = section.locator(':scope > div');
    await expect(page.getByRole('heading', { name: 'Defina nova senha' })).toBeVisible();
    const checkLayout = async () => {
      const geometry = await card.evaluate(element => {
        const bounds = element.getBoundingClientRect();
        const main = element.closest('main')!.getBoundingClientRect();
        const footer = element.closest('main')!.querySelector('.page-footer')!.getBoundingClientRect();
        const content = [...element.children].map(child => ({ padding: parseFloat(getComputedStyle(child).paddingLeft), rightPadding: parseFloat(getComputedStyle(child).paddingRight) }));
        return { content, width: bounds.width, left: bounds.left, right: bounds.right, footerAfterCard: footer.top >= bounds.bottom, footerBottomGap: main.bottom - footer.bottom, overflow: document.documentElement.scrollWidth > innerWidth };
      });
      expect(geometry.overflow).toBe(false);
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(width);
      expect(geometry.width).toBeLessThanOrEqual(501);
      expect(geometry.content.every(part => part.padding >= 24 && part.rightPadding >= 24)).toBe(true);
      expect(geometry.footerAfterCard).toBe(true);
      expect(geometry.footerBottomGap).toBeLessThanOrEqual(25);
    };
    await checkLayout();
    await page.screenshot({ path: `docs/nexos-lab/recovery-form-${width}.png`, fullPage: true });
    await page.getByLabel('Nova senha', { exact: true }).fill('Layout-Password-12345!');
    await page.getByLabel('Confirmar nova senha', { exact: true }).fill('Layout-Password-12345!');
    await page.getByRole('button', { name: 'Salvar nova senha' }).click();
    await expect(page.getByRole('heading', { name: 'Senha atualizada' })).toBeVisible();
    expect(submissions).toBe(1);
    await expect(page).toHaveURL('/portal/redefinir');
    await checkLayout();
    await page.screenshot({ path: `docs/nexos-lab/recovery-success-${width}.png`, fullPage: true });
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Link necessário' })).toBeVisible();
    const fallback = page.locator('section[aria-labelledby="reset-link-title"] > div');
    expect(await fallback.evaluate(element => [...element.children].every(child => parseFloat(getComputedStyle(child).paddingLeft) >= 24))).toBe(true);
  });
}
