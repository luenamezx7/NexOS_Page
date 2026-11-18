import { expect, test } from '@playwright/test';

const panelSelector = '[data-hero-solution-popups]';

async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.locator(panelSelector).scrollIntoViewIfNeeded();
}

for (const width of [320, 390, 430, 768, 1440]) {
  test(`avatar stays static and automatic text is lime and frameless at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openHome(page);
    const scene = page.locator('[data-avatar-scene]');
    const panel = page.locator(panelSelector);
    await expect(panel.getByRole('button')).toHaveCount(0);
    await expect(panel.getByRole('link')).toHaveCount(0);
    await expect(panel.locator('select, input, [role="tablist"], [role="group"]')).toHaveCount(0);
    await expect(page.locator('.pin-spacer', { has: scene })).toHaveCount(0);
    expect(await page.locator('[data-avatar-figure]').evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
    await expect(panel).toHaveCSS('color', 'rgb(185, 239, 117)');
    await expect(panel.locator('[data-popup-copy]')).toHaveCSS('animation-duration', '0.4s');
    await expect(panel.locator('[data-solution-popup] > *')).toHaveCount(1);
    await expect(panel.locator('[data-solution-popup]')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(panel.locator('[data-solution-popup]')).toHaveCSS('border-top-width', '0px');
    await expect(panel.locator('[data-solution-popup]')).toHaveCSS('box-shadow', 'none');
    const initial = await panel.locator('[data-popup-copy]').textContent();
    const frame = await panel.boundingBox();
    await expect.poll(() => panel.locator('[data-popup-copy]').textContent(), { timeout: 5000 }).not.toBe(initial);
    await expect(panel.locator('[data-popup-copy]')).toHaveCSS('opacity', '1');
    const nextFrame = await panel.boundingBox();
    expect(Math.abs(nextFrame!.y - frame!.y)).toBeLessThan(1);
    expect(Math.abs(nextFrame!.height - frame!.height)).toBeLessThan(1);
    await expect(page.locator('[data-scroll-progress] > div')).toHaveCSS('background-color', 'rgb(185, 239, 117)');
    await expect(page.locator('[data-glass-card][data-solution="menu"]')).toHaveCSS('background-color', 'rgb(185, 239, 117)');
    await expect(page.locator('[data-glass-card][data-solution="suporte"]')).toHaveCSS('background-color', 'rgb(185, 239, 117)');
    await expect(panel.locator('[data-solution-popup]')).toHaveCSS('transform', 'none');
    await expect(panel.locator('[data-solution-popup]')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('automatic text retains full motion without animating the avatar when the OS requests reduction', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const panel = page.locator(panelSelector);
  await expect(panel).toContainText('Controle e gestão');
  await expect(panel).toContainText('Sites e portfólios', { timeout: 5000 });
  await expect(panel.locator('[data-popup-copy]')).toHaveCSS('animation-duration', '0.4s');
  expect(await page.locator('[data-avatar-figure]').evaluate(element => element.getAnimations({ subtree: true }).length)).toBe(0);
  await expect(panel.getByRole('button')).toHaveCount(0);
});

test('there is no design selector route', async ({ request }) => {
  const response = await request.get('/design-review');
  expect(response.status()).toBe(404);
});
