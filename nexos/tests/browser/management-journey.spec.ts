import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`management, catalogue and contact remain usable at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('h1')).toHaveAttribute('aria-label', 'Seu negócio conectado em uma aproximação');
    await expect(page.locator('[data-typing-word]')).toBeVisible();
    if (width === 1440) {
      const firstWord = await page.locator('[data-typing-word]').textContent();
      await expect.poll(() => page.locator('[data-typing-word]').textContent()).not.toBe(firstWord);
    }
    const contact = page.locator('#hero a[data-cta-solution="diagnostico"]');
    const destination = new URL((await contact.getAttribute('href'))!);
    expect(destination.hostname).toBe('wa.me');
    expect(destination.searchParams.get('text')).toContain('entender qual solução faz sentido');
    await page.locator('#hero .hero-secondary-action').click();
    await expect(page).toHaveURL(/#ecossistema$/);
    await expect(page.locator('#ecossistema')).toBeFocused();
    await expect(page.locator('#ecossistema article')).toHaveCount(7);
    await expect(page.locator('#ecossistema [data-solution="gestao"]')).toHaveCount(0);
    await expect(page.locator('#ecossistema [data-solution="portfolio"] h3')).toHaveCSS('opacity', '1');
    await expect(page.locator('[data-solution="easychat"]')).toContainText('Em desenvolvimento');
    await expect(page.locator('[data-solution="chatbot"]')).toHaveCount(0);
    await page.locator('#gestao').scrollIntoViewIfNeeded();
    await expect(page.locator('#management-title')).toHaveCSS('opacity', '1');
    await expect(page.locator('#management-title')).toHaveCSS('background-image', /rgb\(25, 23, 28\)/);
    await page.locator('#gestao').screenshot({ path: `test-results/management-${width}.png` });
    await page.locator('#gestao [data-management-tab]').filter({ hasText: 'Financeiro' }).click();
    await expect(page.locator('#management-demo img')).toHaveAttribute('src', /controle-ezway-login\.png/);
    await expect.poll(() => page.locator('#management-demo img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(page.locator('#gestao figcaption')).toContainText('Tela de login do Controle · ezway');
    await page.locator('#gestao [data-management-tab]').filter({ hasText: 'Comercial' }).click();
    await expect(page.locator('#management-demo img')).toHaveAttribute('src', /controle-ezway-login\.png/);
    await expect(page.locator('#gestao [data-management-tab]')).toHaveCount(3);
    await expect(page.locator('#comparacao')).toHaveJSProperty('open', false);
    await page.locator('#comparacao > summary').click();
    await expect(page.locator('#comparacao a')).toHaveCount(2);
    await expect(page.locator('#exemplos')).not.toBeVisible();
    await page.getByText('Ver exemplos por tipo de negócio', { exact: true }).click();
    await page.locator('#exemplos').scrollIntoViewIfNeeded();
    await expect(page.locator('#exemplos article')).toHaveCount(5);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('reduced motion stays static and exposes every digital example, including after a preference change', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#services');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0);
  await expect(page.locator('main.landing-page')).toHaveAttribute('data-motion-detail', 'reduced');
  await expect(page.locator('html')).not.toHaveClass(/lenis/);
  const stage = page.locator('[data-services-journey]');
  await expect(stage).toHaveCSS('position', 'relative');
  await page.getByRole('button', { name: 'Ver solução: Landing page' }).click();
  await expect(page.locator('[data-macbook-slide][data-active="true"]')).toContainText('Uma pausa para o seu dia.');
  await expect(page.locator('[data-macbook-slide][data-active="true"]')).toHaveCSS('opacity', '1');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('main.landing-page')).toHaveAttribute('data-motion-detail', 'full');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main.landing-page')).toHaveAttribute('data-motion-detail', 'reduced');
  await page.getByRole('button', { name: 'Ver solução: Portfólio' }).click();
  await expect(page.locator('[data-macbook-slide][data-active="true"]')).toHaveCSS('opacity', '1');
});

test('essential opening and management content are readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');
  await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', 'Seu negócio conectado em uma aproximação');
  await expect(page.locator('[data-typing-word]')).toContainText('conectado');
  await expect(page.locator('#management-demo img')).toHaveAttribute('src', /controle-ezway-login\.png/);
  await expect(page.locator('#hero a[data-cta-solution="diagnostico"]')).toHaveAttribute('href', /wa.me/);
  await context.close();
});
