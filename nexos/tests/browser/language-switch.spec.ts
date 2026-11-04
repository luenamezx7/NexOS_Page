import { expect, test } from '@playwright/test';

// Prefer the bundled browser in CI; allow locally installed Chrome when it is unavailable.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('switches the public site between Portuguese, English and Spanish, preserving the choice', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  const switcher = page.getByRole('banner').getByRole('button', { name: 'Selecionar idioma: Português' });
  await expect(switcher).toBeVisible();
  await expect(switcher.locator('img')).toHaveAttribute('src', '/flags/br.svg');
  await switcher.click();
  const english = page.getByRole('menuitem', { name: 'English' });
  await expect(english.locator('img')).toHaveAttribute('src', '/flags/us.svg');
  await expect(page.getByRole('menuitem', { name: 'Español' }).locator('img')).toHaveAttribute('src', '/flags/es.svg');
  await english.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI-powered solutions');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Select language: English' }).locator('img')).toHaveAttribute('src', '/flags/us.svg');

  await page.goto('/criacao-de-sites');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A website worthy of your business.');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Select language: English' })).toBeVisible();

  await page.getByRole('banner').getByRole('button', { name: 'Select language: English' }).click();
  await page.getByRole('menuitem', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Un sitio a la altura de tu negocio.');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Seleccionar idioma: Español' }).locator('img')).toHaveAttribute('src', '/flags/es.svg');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Un sitio a la altura de tu negocio.');

  for (const [path, headline] of [
    ['/landing-pages', 'Una página. Una oferta clara.'],
    ['/cardapio-digital', 'Tu menú, en la pantalla del cliente.'],
    ['/placa-nfc', 'Acerca. Escanea. Conecta.'],
  ]) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(headline);
  }

  await page.goto('/privacidade');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Política de Privacidade');
  await expect(page.getByRole('banner').getByRole('button', { name: /Seleccionar idioma/ })).toHaveCount(0);

  await page.goto('/placa-nfc');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('banner').getByRole('button', { name: 'Seleccionar idioma: Español' }).click();
  await page.getByRole('menuitem', { name: 'Português' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aproxime. Escaneie. Conecte.');
});

test('keeps the language switch accessible without horizontal overflow', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  for (const width of [390, 1024, 1199, 1200, 1366]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(page.getByRole('banner').getByRole('button', { name: 'Selecionar idioma: Português' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1200) {
      await page.getByRole('banner').getByRole('button', { name: 'Abrir menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  }
});

test('keeps the coral hero highlights in both languages and aligns the EasyChat preview with the phone screen', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  await expect(page.getByRole('banner').locator('[data-brand-way]')).toHaveText('way');
  await expect(page.getByRole('banner').locator('[data-wordmark]')).toHaveText('ez');

  for (const words of [['Soluções', 'IA'], ['AI-powered', 'solutions']]) {
    for (const word of words) {
      const accent = page.locator('#hero').locator(`[data-reveal-word="${word}"]`);
      await expect(accent).toHaveCSS('background-image', 'none');
      await expect(accent).toHaveCSS('color', 'rgb(255, 143, 130)');
      await expect(accent).toHaveCSS('text-shadow', 'none');
    }
    if (words[0] === 'Soluções') {
      await page.getByRole('banner').getByRole('button', { name: 'Selecionar idioma: Português' }).click();
      await page.getByRole('menuitem', { name: 'English' }).click();
    }
  }

  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    const phone = page.locator('#easychat [data-iphone]');
    await phone.scrollIntoViewIfNeeded();
    expect(await phone.evaluate(el => {
      const media = el.querySelector('[class*="__media"]')!.getBoundingClientRect();
      const screen = el.querySelector('[class*="__phoneScreen"]')!.getBoundingClientRect();
      const input = el.querySelector('[class*="__phoneInput"]')!.getBoundingClientRect();
      return Math.abs(media.left - screen.left) < 1 && Math.abs(media.top - screen.top) < 1 &&
        Math.abs(media.width - screen.width) < 1 && Math.abs(media.height - screen.height) < 1 &&
        input.bottom <= screen.bottom && input.top >= screen.top;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('fills the pink top progress line when scrolling and resets at the start', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const progress = page.getByRole('progressbar', { name: 'Progresso da página' });
  await expect(progress).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação de seções' })).toHaveCount(0);
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(95);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(5);
});
