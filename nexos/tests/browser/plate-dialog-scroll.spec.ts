import { expect, test } from '@playwright/test';

for (const width of [390, 1366]) {
  test(`${width}px: opening and closing a plate does not move the page`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto('/');
    const intro = page.locator('dialog[data-presentation]');
    if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(intro).toHaveCount(0);
    const rejectCookies = page.getByRole('button', { name: 'Recusar', exact: true });
    if (await rejectCookies.isVisible()) await rejectCookies.click();

    const plate = page.locator('#showcase [data-plate-option] button').first();
    await plate.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const before = await page.evaluate(() => window.scrollY);
    const box = await plate.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    const close = page.getByRole('button', { name: 'Fechar detalhes da placa' });
    await expect(close).toBeFocused();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
    await close.click();
    await expect(page.locator('dialog:modal')).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(before);
  });
}
