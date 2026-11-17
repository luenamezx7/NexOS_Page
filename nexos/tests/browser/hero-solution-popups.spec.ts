import { expect, test, type Locator } from '@playwright/test';

const panelSelector = '[data-hero-solution-popups]';
const examples = ['Controle e gestão', 'Sites e portfólios', 'Mini-sites/Bio-links', 'EasyChat | Chatbot IA'];

async function expectSettledWords(panel: Locator) {
  await expect.poll(() => panel.locator('[data-solution-popup]').evaluateAll(words => words.every(word => {
    const transform = getComputedStyle(word).transform;
    return getComputedStyle(word).opacity === '1' && (transform === 'none' || Math.abs(new DOMMatrixReadOnly(transform).m42) < .1);
  }))).toBe(true);
}

for (const width of [320, 390, 430, 768, 1440]) {
  test(`one rotating hero popup stays readable beside the avatar at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    const panel = page.locator(panelSelector);
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.getByRole('listitem')).toHaveCount(1);
    await expect(panel.getByRole('listitem')).toBeVisible();
    const avatar = page.locator('[class*=avatarFrame]');
    const avatarBox = await avatar.boundingBox();
    const panelBox = await panel.boundingBox();
    expect(Math.abs((avatarBox!.y + avatarBox!.height / 2) - (panelBox!.y + panelBox!.height / 2))).toBeLessThan(2);
    expect(panelBox!.x + panelBox!.width / 2).toBeGreaterThan(avatarBox!.x + avatarBox!.width / 2);
    await expect(panel.locator('img')).toHaveCount(0);
    await expectSettledWords(panel);
    expect(await panel.evaluate(element => {
      const box = element.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && [...element.querySelectorAll('li')].every(row => {
        // Glow layers deliberately extend past each popup. Check the text and
        // visible popup bounds rather than counting that decorative overflow.
        const copy = row.querySelector<HTMLElement>('[data-popup-copy]')!;
        const popupBox = row.getBoundingClientRect();
        const copyBox = copy.getBoundingClientRect();
        return popupBox.left >= 0 && popupBox.right <= innerWidth && copyBox.left >= popupBox.left && copyBox.right <= popupBox.right + 1 && copy.scrollWidth <= copy.clientWidth + 1;
      });
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(panel.locator('a')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('popups switch without movement with reduced motion, including preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const panel = page.locator(panelSelector);
  await panel.scrollIntoViewIfNeeded();
  await expect(panel.getByRole('listitem')).toHaveCount(1);
  expect(await panel.locator('[data-solution-popup]').evaluateAll(words => words.every(word => word.getAnimations().length === 0))).toBe(true);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectSettledWords(panel);
});

test('first popup remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/');
  const panel = page.locator(panelSelector);
  await expect(panel.getByRole('listitem')).toHaveCount(1);
  await expect(panel.getByRole('listitem')).toContainText(examples[0]);
  await expect(panel.locator('a')).toHaveCount(0);
  await context.close();
});

for (const [locale, heading, lastItem] of [
  ['en', 'EZWAY SOLUTIONS', 'EasyChat | AI Chatbot', 'Explore solutions'],
  ['es', 'SOLUCIONES EZWAY', 'EasyChat | Chatbot IA', 'Explorar soluciones'],
]) {
  test(`popups use ${locale} translations`, async ({ page }) => {
    await page.addInitScript(language => localStorage.setItem('easyway-language', language), locale);
    await page.goto('/');
    const panel = page.locator(panelSelector);
    await expect(panel).toHaveAttribute('aria-label', heading);
    await expect(panel.getByRole('listitem')).toHaveCount(1);
    await expect(panel.getByRole('listitem')).toContainText(lastItem, { timeout: 15000 });
    await expect(panel.locator('a')).toHaveCount(0);
  });
}

test('popups rotate through the sequence every three seconds and loop', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const panel = page.locator(panelSelector);
  await panel.scrollIntoViewIfNeeded();
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  // Observe the live sequence, including the return to the first item.
  await expect(panel).toContainText(examples[0], { timeout: 15000 });
  for (const example of [...examples.slice(1), examples[0]]) {
    await expect(panel).toContainText(example, { timeout: 5000 });
    await expect(panel.getByRole('listitem')).toHaveCount(1);
    await expectSettledWords(panel);
    const avatarBox = await page.locator('[class*=avatarFrame]').boundingBox();
    const popupBox = await panel.locator('[data-solution-popup]').boundingBox();
    // Different card heights must stay centered beside the unchanged avatar.
    expect(Math.abs((popupBox!.y + popupBox!.height / 2) - (avatarBox!.y + avatarBox!.height / 2))).toBeLessThan(2);
  }
});
