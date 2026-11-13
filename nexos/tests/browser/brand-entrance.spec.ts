import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('a apresentação automática usa a logo do fechamento e reaparece após F5', async ({ page }) => {
  await page.goto('/#hero');
  const dialog = page.getByRole('dialog', { name: 'Apresentação ezway' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  const logo = dialog.getByText('ezway', { exact: true });
  const way = logo.locator('span');
  // The current wordmark uses a solid accent; the surrounding frame animates.
  expect(await way.evaluate(el => getComputedStyle(el).color)).not.toBe(await logo.evaluate(el => getComputedStyle(el).color));
  const family = await logo.evaluate(el => getComputedStyle(el).fontFamily);
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('#hero')).toBeFocused();
  await expect(page.locator('#hero')).toHaveCSS('outline-style', 'none');
  await expect(page.locator('#brand-closing h2')).toHaveCSS('font-family', family);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

  await page.reload();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});

test('o contador progride até 100% antes da abertura e reinicia ao repetir a apresentação', async ({ page }) => {
  await page.goto('/');
  const dialog = page.locator('dialog[data-presentation]');
  const progress = dialog.locator('[data-presentation-progress]');
  await expect(progress).toHaveAttribute('role', 'progressbar');
  await expect(progress).toHaveAttribute('aria-valuemin', '0');
  await expect(progress).toHaveAttribute('aria-valuemax', '100');
  await expect(progress).toHaveAttribute('aria-valuenow', /\d+/);
  const percentage = dialog.locator('[data-presentation-percentage]');
  await expect(percentage).toBeVisible();
  const logoBounds = await dialog.getByText('ezway', { exact: true }).boundingBox();
  const numberBounds = await percentage.boundingBox();
  expect(numberBounds!.y).toBeGreaterThan(logoBounds!.y + logoBounds!.height);
  expect(Math.abs(numberBounds!.x + numberBounds!.width / 2 - logoBounds!.x - logoBounds!.width / 2)).toBeLessThan(2);
  await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '100');
  await expect(percentage).toHaveText('100%');
  await expect(dialog).toHaveCount(0);

  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(progress).toHaveAttribute('aria-valuenow', '0');
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await expect(progress).toHaveAttribute('aria-valuenow', '100');
  await expect(dialog).toHaveCount(0);
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
  await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(dialog).toHaveCount(0);
  const beforeReload = await bounds();
  await page.reload();
  await expect(dialog).toBeVisible();
  const covered = await bounds();
  await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
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
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: a entrada mobile respeita movimento reduzido e mantém o hero limpo`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.goto('/');
    const dialog = page.locator('dialog[data-presentation]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('ezway', { exact: true }).locator('span')).toHaveCSS('animation-name', 'none');
    await expect(dialog).toHaveCount(0, { timeout: 6000 });
    await expect(page.locator('.landing-edge-blur, .landing-header-blur')).toHaveCount(2);
    await expect(page.locator('#hero [data-hero-brand-strip]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#services').scrollIntoViewIfNeeded();
    await expect(page.locator('.landing-edge-blur')).toHaveCount(1);
    await expect(page.locator('.landing-header-blur')).toHaveCount(1);
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
    await expect(page.locator('#hero a[href="#showcase"]')).toBeVisible();
  } finally {
    await context.close();
  }
});
