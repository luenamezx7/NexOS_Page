import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('a abertura mostra somente o mascote e reaparece após F5', async ({ page }) => {
  await page.goto('/#hero');
  const dialog = page.getByRole('dialog', { name: 'Apresentação ezway' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await expect(dialog.getByRole('img', { name: 'Mascote ezway' })).toBeVisible();
  await expect(dialog.getByRole('button')).toHaveCount(0);
  await expect(dialog.getByRole('progressbar')).toHaveCount(0);
  await expect(dialog.locator('[data-brand-way]')).toHaveCount(0);
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('#hero')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  await page.reload();
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});

test('recarregar mantém o hero alinhado durante a saída da apresentação', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/');
  const dialog = page.locator('dialog[data-presentation]');
  await expect(dialog).toBeVisible();
  const bounds = () => page.locator('#hero').evaluate(element => {
    const rect = element.getBoundingClientRect();
    return { x: rect.x, width: rect.width, scrollWidth: document.documentElement.scrollWidth };
  });
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  const beforeReload = await bounds();
  await page.reload();
  await expect(dialog).toBeVisible();
  const covered = await bounds();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect.poll(bounds).toEqual(covered);
  expect(await bounds()).toEqual(beforeReload);
});

test('o controle do footer repete a nova apresentação e Escape revela o hero', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação ezway' });
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: a entrada mobile mostra o mascote estático e libera a página com reduce`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.goto('/');
    const dialog = page.locator('dialog[data-presentation]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('img', { name: 'Mascote ezway' })).toBeVisible();
    await expect(dialog).toHaveCount(0, { timeout: 8000 });
    await expect(page.locator('#hero')).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#gestao').scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
  });
}

test('links diretos exibem a apresentação antes de restaurar a seção pedida', async ({ page }) => {
  await page.goto('/#showcase');
  const dialog = page.getByRole('dialog', { name: 'Apresentação ezway' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await expect.poll(() => page.locator('#showcase').evaluate(el => Math.abs(el.getBoundingClientRect().top) < 160)).toBe(true);
});

test('sem JavaScript a apresentação não bloqueia o conteúdo', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.locator('[data-presentation]')).toBeHidden();
    await expect(page.locator('#hero h1')).toBeVisible();
    await expect(page.locator('#hero a[href="#ecossistema"]')).toBeVisible();
  } finally {
    await context.close();
  }
});
