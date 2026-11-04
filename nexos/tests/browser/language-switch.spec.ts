import { expect, test } from '@playwright/test';

// Prefer the bundled browser in CI; allow locally installed Chrome when it is unavailable.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('switches the public site between Portuguese and English, preserving the choice', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  const switcher = page.getByRole('banner').getByRole('button', { name: 'Switch to English' });
  await expect(switcher).toBeVisible();
  await switcher.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI-powered solutions');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Mudar para português' })).toBeVisible();

  await page.goto('/criacao-de-sites');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A website worthy of your business.');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Mudar para português' })).toBeVisible();

  await page.goto('/privacidade');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Política de Privacidade');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Mudar para português' })).toHaveCount(0);

  await page.goto('/placa-nfc');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('banner').getByRole('button', { name: 'Mudar para português' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aproxime. Escaneie. Conecte.');
});

test('keeps the language switch accessible without horizontal overflow', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  for (const width of [390, 1024, 1199, 1200, 1366]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(page.getByRole('banner').getByRole('button', { name: 'Switch to English' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1200) {
      await page.getByRole('banner').getByRole('button', { name: 'Abrir menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  }
});

test('keeps the lime hero highlights in both languages and aligns the EasyChat preview with the phone screen', async ({ page }) => {
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
      await expect(accent).toHaveCSS('color', 'rgb(217, 242, 42)');
      await expect(accent).toHaveCSS('text-shadow', 'none');
    }
    if (words[0] === 'Soluções') await page.getByRole('banner').getByRole('button', { name: 'Switch to English' }).click();
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
