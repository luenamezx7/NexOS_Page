import { expect, test } from '@playwright/test';

for (const width of [320, 768, 1440]) {
  test(`plate display aligns its rows and remains tappable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
    await page.goto('/');
    const intro = page.locator('dialog[data-presentation]');
    if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(intro).toHaveCount(0);
    const grid = page.locator('[data-plate-grid]');
    await grid.scrollIntoViewIfNeeded();
    const buttons = grid.getByRole('button');
    await expect(buttons).toHaveCount(4);
    const boxes = await buttons.evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      const caption = element.querySelector('[data-plate-caption]')!.getBoundingClientRect();
      return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, captionY: caption.y };
    }));
    const columns = width >= 1024 ? 4 : 2;
    for (let index = 0; index < 4; index++) {
      const rowStart = Math.floor(index / columns) * columns;
      expect(Math.abs(boxes[index].y - boxes[rowStart].y)).toBeLessThan(1);
      expect(Math.abs(boxes[index].captionY - boxes[rowStart].captionY)).toBeLessThan(1);
      expect(Math.abs(boxes[index].bottom - boxes[rowStart].bottom)).toBeLessThan(1);
      expect(boxes[index].x).toBeGreaterThanOrEqual(0);
      expect(boxes[index].right).toBeLessThanOrEqual(width);
      expect(boxes[index].width).toBeGreaterThan(100);
    }
    // Caption text is part of the real control, rather than a decorative action.
    await buttons.first().getByText('Ver detalhes').click();
    const dialog = page.getByRole('dialog', { name: 'Cardápio digital' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(buttons.first()).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
