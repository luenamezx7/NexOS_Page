import { expect, test } from '@playwright/test';

test.setTimeout(60000);

for (const width of [1366, 390]) {
  test(`${width}px: scroll aproxima o texto, permite voltar e revela o hero real`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
    const portal = dialog.locator('[data-gp-transparent]');
    await expect(portal).toHaveAttribute('data-gp-motion', 'on', { timeout: 15000 });
    await expect(portal).toHaveAttribute('data-gp-focus', 'N');
    await expect(dialog.getByRole('heading')).toHaveText('Nexos, a performance que seu business merece.');
    await page.screenshot({ path: testInfo.outputPath(`portal-${width}-start.png`) });
    const initialScale = Number(await portal.getAttribute('data-gp-scale'));
    const travel = await portal.evaluate(e => Number.parseFloat(e.style.getPropertyValue('--gp-height')) * 1.5);
    await page.mouse.move(width / 2, 200);
    await page.mouse.wheel(0, 240);
    await expect.poll(async () => Number(await portal.getAttribute('data-gp-progress'))).toBeGreaterThan(0.05);
    for (const progress of [0.25, 0.55, 0.65]) {
      await dialog.evaluate((e, top) => e.scrollTo({ top, behavior: 'instant' }), travel * progress);
      await expect.poll(async () => Number(await portal.getAttribute('data-gp-progress'))).toBeCloseTo(progress, 1);
      if (progress >= 0.55) {
        const opacity = await portal.evaluate(e => Number(e.style.getPropertyValue('--gp-scene-opacity')));
        expect(opacity).toBeLessThan(0.3);
      }
      expect(Number(await portal.getAttribute('data-gp-scale'))).toBeGreaterThan(initialScale);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await page.screenshot({ path: testInfo.outputPath(`portal-${width}-${progress}.png`) });
    }
    await dialog.evaluate(e => e.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(async () => Number(await portal.getAttribute('data-gp-progress'))).toBeLessThan(0.01);
    await dialog.evaluate((e, top) => e.scrollTo({ top, behavior: 'instant' }), travel * 0.71);
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#hero')).toBeFocused();
    await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
    expect(errors).toEqual([]);
  });
}

test('apresentação não oferece botão ou link de entrada', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  const portal = dialog.locator('[data-gp-transparent]');
  await expect(portal).toHaveAttribute('data-gp-motion', 'on', { timeout: 15000 });
  await expect(dialog.getByRole('button')).toHaveCount(0);
  await expect(dialog.locator('[data-gp-enter]')).toHaveCount(0);
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('End');
  await expect(dialog).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#hero')).toBeFocused();
  await expect(page.locator('#hero')).toHaveCount(1);
});

test('toque percorre o portal no celular', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: 'http://localhost:3100', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto('/');
    const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
    const portal = dialog.locator('[data-gp-transparent]');
    await expect(portal).toHaveAttribute('data-gp-motion', 'on', { timeout: 15000 });
    const session = await context.newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 650 }] });
    for (let y = 610; y >= 290; y -= 40) {
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y }] });
      await page.waitForTimeout(30);
    }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => Number(await portal.getAttribute('data-gp-progress'))).toBeGreaterThan(0.1);
    await page.keyboard.press('End');
    await expect(dialog).toHaveCount(0);
    await expect(page.locator('#hero')).toBeFocused();
  } finally { await context.close(); }
});

test('movimento reduzido mantém a leitura e entrada direta', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  await expect(dialog.getByRole('heading')).toBeVisible();
  await expect(dialog).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Sites para/ })).toBeVisible();
});

test('teclado aproxima o texto e conclui a entrada no hero', async ({ page }) => {
  await page.goto('/');
  const dialog = page.getByRole('dialog', { name: 'Apresentação NexOS' });
  const portal = dialog.locator('[data-gp-transparent]');
  await expect(portal).toHaveAttribute('data-gp-motion', 'on', { timeout: 15000 });
  await page.keyboard.press('PageDown');
  await expect.poll(async () => Number(await portal.getAttribute('data-gp-progress'))).toBeGreaterThan(0.1);
  await page.keyboard.press('End');
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
});
