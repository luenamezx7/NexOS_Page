import { expect, test, type Page } from '@playwright/test';

async function openHome(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  });
  await page.goto('/#hero');
  const presentation = page.locator('dialog[data-presentation][open]');
  if (await presentation.count()) {
    await presentation.getByRole('button', { name: 'Pular apresentação' }).click();
    await expect(presentation).toHaveCount(0);
  }
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of [
  { width: 320, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 720 },
  { width: 1440, height: 900 },
]) {
  test(`hero action and quiz do not collide at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    const action = page.locator('#hero').getByRole('link', { name: 'Conhecer a Placa NFC' });
    const quiz = page.locator('#contact');
    await expect(action).toBeVisible();
    const actionBox = (await action.boundingBox())!;
    const quizBox = (await quiz.boundingBox())!;
    expect(actionBox.y + actionBox.height).toBeLessThan(quizBox.y - 16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (viewport.width < 768) {
      const heroBox = (await page.locator('#hero').boundingBox())!;
      expect(quizBox.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1);
    }
  });
}

test('mobile toolbar-height changes do not move the quiz or reverse downward scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await openHome(page);
  const quiz = page.locator('#contact');
  const topBefore = await quiz.evaluate(element => (element as HTMLElement).offsetTop);
  await page.setViewportSize({ width: 390, height: 780 });
  const topAfter = await quiz.evaluate(element => (element as HTMLElement).offsetTop);
  expect(Math.abs(topAfter - topBefore)).toBeLessThan(48);

  let previous = await page.evaluate(() => scrollY);
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(180);
    const current = await page.evaluate(() => scrollY);
    expect(current).toBeGreaterThan(previous);
    previous = current;
  }
});
