import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  const presentation = page.locator('dialog[data-presentation]');
  if (await presentation.isVisible()) await presentation.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(presentation).toHaveCount(0);
}

for (const width of [390, 1366]) {
  test(`${width}px: the four plate purposes open a sharp accessible detail and return focus`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openHome(page);
    const cards = page.locator('#showcase [data-plate-option]');
    await expect(cards).toHaveCount(4);
    for (const [id, title] of [['menu', 'Cardápio digital'], ['instagram', 'Instagram'], ['whatsapp', 'WhatsApp'], ['google', 'Google']] as const) {
      const button = page.locator(`#showcase [data-plate-option="${id}"] button`);
      await button.scrollIntoViewIfNeeded();
      await button.click();
      const detail = page.getByRole('dialog', { name: title });
      await expect(detail).toBeVisible();
      const before = await page.evaluate(() => scrollY);
      await expect(detail.getByRole('button', { name: 'Fechar detalhes da placa' })).toBeFocused();
      await expect(detail.locator('[data-plate-face] > img')).toBeVisible();
      await expect(detail.locator('[data-plate-dialog-content]')).toHaveCSS('opacity', '1');
      await expect(detail.locator('[data-demo-qr] img')).toBeVisible();
      const url = new URL((await detail.getByRole('link', { name: 'Entender mais' }).getAttribute('href'))!);
      expect(url.searchParams.get('text')).toContain(title);
      await page.keyboard.press('Escape');
      await expect(detail).toBeHidden();
      await expect(button).toBeFocused();
      await expect.poll(() => page.evaluate(previous => Math.abs(scrollY - previous), before)).toBeLessThan(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('use case is preserved without a quantity field and demo QR codes have unique public destinations', async ({ page }) => {
  await openHome(page);
  const showcase = page.locator('#showcase');
  await expect(showcase.getByRole('group', { name: 'Quantidade de placas' })).toHaveCount(0);
  await showcase.getByRole('button', { name: 'Ver placa Instagram' }).click();
  const detail = page.getByRole('dialog', { name: 'Instagram' });
  const message = new URL((await detail.getByRole('link', { name: 'Entender mais' }).getAttribute('href'))!).searchParams.get('text');
  expect(message).toContain('Instagram');
  expect(message).not.toMatch(/\d+ Placas Inteligentes/);
  await detail.getByRole('button', { name: 'Fechar detalhes da placa' }).click();
  expect(new URL((await showcase.getByRole('link', { name: 'Conversar sobre minha placa' }).getAttribute('href'))!).searchParams.get('text')).toContain('Instagram');
  await expect(page.locator('#services')).toContainText('Você escolheu: Instagram');
  await expect(page.locator('#services [data-relevant="true"]')).toHaveCount(1);
  await expect(showcase.locator('[data-plate-option] [data-demo-qr] img')).toHaveCount(4);
  const qrs = await showcase.locator('[data-plate-option] [data-demo-qr] img').evaluateAll(images => images.map(image => (image as HTMLImageElement).src));
  expect(new Set(qrs).size).toBe(4);
  const artwork = await showcase.locator('[data-plate-option] [data-plate-face] > img').evaluateAll(images => images.map(image => (image as HTMLImageElement).getAttribute('src')));
  expect(artwork).toEqual(['/nfcs/nfccardapio.svg', '/nfcs/nfcinsta.svg', '/nfcs/nfcwpp.svg', '/nfcs/nfcgoogle.svg']);
});

test('direct showcase link, reverse scroll and orientation keep four choices in normal flow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#showcase');
  const presentation = page.locator('dialog[data-presentation]');
  if (await presentation.isVisible()) await presentation.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(presentation).toHaveCount(0);
  await expect.poll(() => page.locator('#showcase').evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(180);
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.locator('#showcase').scrollIntoViewIfNeeded();
  for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await expect(page.locator('#showcase [data-plate-option]')).toHaveCount(4);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('core journey precedes secondary sections and reduced motion leaves every plate in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const order = await page.locator('#main-content').evaluate(root => ['hero', 'fisico-digital', 'showcase', 'services', 'plate-management', 'easychat', 'delivery-process', 'proof', 'plans', 'contact'].map(id => root.querySelector(`#${id}`)?.getBoundingClientRect().top));
  expect(order.every((top, i) => top !== undefined && (i === 0 || top > order[i - 1]!))).toBe(true);
  await page.locator('#showcase').scrollIntoViewIfNeeded();
  await expect(page.locator('#showcase [data-plate-motion]').first()).toHaveCSS('transform', 'none');
});

test('scroll reveals the floating plates and highlights section keywords', async ({ page }) => {
  await openHome(page);
  const showcase = page.locator('#showcase');
  await showcase.locator('[data-highlighted-text]').scrollIntoViewIfNeeded();
  await expect.poll(() => showcase.locator('[data-highlighted-text] > span').first().evaluate(element => getComputedStyle(element).transform)).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  await showcase.locator('[data-plate-grid]').scrollIntoViewIfNeeded();
  await expect.poll(() => showcase.locator('[data-plate-motion]').first().evaluate(element => Number.parseFloat(getComputedStyle(element).opacity))).toBeGreaterThan(.95);
  await page.locator('#services [data-highlighted-text]').scrollIntoViewIfNeeded();
  await expect(page.locator('#services [data-highlighted-text]')).toBeVisible();
});
