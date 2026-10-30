import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
});

test('a apresentação automática usa a logo do fechamento e reaparece após F5', async ({ page }) => {
  await page.goto('/#hero');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toBeFocused();
  const logo = dialog.getByText('NEXOS', { exact: true });
  await expect(logo).toHaveCSS('background-clip', /text/);
  expect(await logo.evaluate(el => getComputedStyle(el).animationName)).not.toBe('none');
  const family = await logo.evaluate(el => getComputedStyle(el).fontFamily);
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await expect(page.locator('#hero')).toBeFocused();
  await expect(page.locator('#brand-closing h2')).toHaveCSS('font-family', family);
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');

  await page.reload();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});

test('o controle do footer repete a nova apresentação e Escape revela o hero', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
  await page.getByRole('button', { name: 'Ver apresentação', exact: true }).click();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: a entrada mobile respeita movimento reduzido e libera a faixa`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(theme => localStorage.setItem('nexos-theme', theme), theme);
    await page.goto('/');
    const dialog = page.locator('dialog[data-presentation]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('NEXOS', { exact: true })).toHaveCSS('animation-name', 'none');
    await expect(dialog).toHaveCount(0, { timeout: 6000 });
    await expect(page.locator('.landing-edge-blur, .landing-header-blur')).toHaveCount(0);
    const strip = page.getByRole('region', { name: 'Pilares da NexOS' });
    await expect(strip.getByRole('listitem')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.locator('#services').scrollIntoViewIfNeeded();
    await expect(page.locator('.landing-edge-blur')).toHaveCount(1);
    await expect(page.locator('.landing-header-blur')).toHaveCount(1);
  });
}

test('links diretos exibem a apresentação antes de restaurar a seção pedida', async ({ page }) => {
  await page.goto('/#showcase');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
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
    await expect(page.locator('#hero .primary-action')).toHaveAttribute('href', /^https:\/\//);
  } finally {
    await context.close();
  }
});
