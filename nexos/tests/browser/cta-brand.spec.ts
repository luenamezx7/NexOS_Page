import { expect, test } from '@playwright/test';

test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

for (const width of [390, 1366]) {
  test(`${width}px: final CTA shows the 3D mascot alongside its copy`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const intro = page.locator('dialog[data-presentation]');
    if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(intro).toHaveCount(0);
    const section = page.locator('#cta-final');
    await section.scrollIntoViewIfNeeded();
    const title = section.getByRole('heading', { name: 'Sua próxima ideia. Vamos colocar no ar?' });
    const image = section.getByRole('img', { name: /Mascote 3D/ });
    await expect(title).toBeVisible();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('src', /Glossy%20Black%20Flame%20Mascot1/i);
    await expect.poll(() => image.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await expect(image).toHaveCSS('filter', /drop-shadow/);
    await expect(section.locator('[data-cta-visual]')).toHaveCSS('overflow', 'visible');
    await expect(section.getByRole('link', { name: /Agendar conversa/ })).toBeVisible();
    const heading = (await title.boundingBox())!;
    const artwork = (await section.locator('[data-cta-visual]').boundingBox())!;
    if (width < 768) expect(artwork.y).toBeGreaterThan(heading.y + heading.height);
    else expect(artwork.x).toBeGreaterThan(heading.x + heading.width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('desktop mascot responds to the cursor', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const visual = page.locator('#cta-final [data-cta-visual]');
  await visual.scrollIntoViewIfNeeded();
  const image = page.locator('#cta-final [data-cta-parallax]');
  const box = (await visual.boundingBox())!;
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .8);
  await expect.poll(() => image.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
});

test('reduced motion leaves the mascot still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const visual = page.locator('#cta-final [data-cta-visual]');
  await visual.scrollIntoViewIfNeeded();
  const box = (await visual.boundingBox())!;
  await page.mouse.move(box.x + box.width * .8, box.y + box.height * .8);
  await expect(page.locator('#cta-final [data-cta-parallax]')).toHaveCSS('transform', 'none');
});
