import { expect, test } from '@playwright/test';

for (const locale of ['pt', 'en', 'es'] as const) {
  test(`${locale}: removed quiz leaves the contact path available`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('easyway-language', language);
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      sessionStorage.setItem('nexos-boot-seen', '1');
    }, locale);
    await page.goto('/#contact');
    const presentation = page.locator('dialog[data-presentation][open]');
    if (await presentation.count()) await presentation.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(page.locator('#contact')).toHaveCount(1);
    await expect(page.locator('#contact')).toBeAttached();
    await expect(page.locator('[role="group"][aria-label*="Pergunta"], #contact [role="progressbar"]')).toHaveCount(0);
    await expect(page.locator('#cta-final a[href^="https://wa.me/"]')).toHaveCount(1);
  });
}

test('contact link from an internal page reaches the final CTA instead of the removed quiz', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
    sessionStorage.setItem('nexos-boot-seen', '1');
  });
  await page.goto('/criacao-de-sites');
  await page.getByRole('contentinfo').getByRole('link', { name: 'Contato', exact: true }).click();
  await expect(page).toHaveURL(/\/#cta-final$/);
  await expect(page.locator('#cta-final')).toBeVisible();
  await expect(page.locator('#contact [role="group"]')).toHaveCount(0);
});
