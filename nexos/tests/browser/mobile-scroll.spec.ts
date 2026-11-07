import { expect, test } from '@playwright/test';

test('mobile sections remain readable with lightweight blur and scroll animations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /Pular apresentação/ }).click();
  await expect(page.locator('[data-presentation]')).toHaveCount(0);

  for (const id of ['showcase', 'services', 'plate-management', 'easychat', 'delivery-process', 'plans', 'contact', 'cta-final']) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth), id).toBeLessThanOrEqual(390);
  }

  for (const edge of ['header', 'edge']) {
    const blur = page.locator(`.landing-${edge}-blur`);
    await expect(blur).toBeVisible();
    await expect(blur.locator('[data-gradual-blur-layer]')).toHaveCount(2);
    expect(await blur.locator('[data-gradual-blur-layer]').first().evaluate(el => getComputedStyle(el).backdropFilter)).not.toBe('none');
  }
  for (const id of ['plate-management', 'easychat']) {
    const visual = page.locator(`#${id} [data-journey-visual]`);
    await visual.scrollIntoViewIfNeeded();
    await expect(visual).toHaveCSS('opacity', '1');
  }
  expect(errors).toEqual([]);
});
