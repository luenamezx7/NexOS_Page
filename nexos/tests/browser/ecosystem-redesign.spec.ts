import { expect, test, type Page } from '@playwright/test';

test.setTimeout(90000);
const ids = ['site', 'menu', 'nfc', 'portfolio', 'landing', 'easychat', 'suporte'];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

async function open(page: Page) {
  await page.goto('/#ecossistema');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
  await expect(page.locator('[data-ecosystem-stage]')).toHaveAttribute('data-scroll-cards', 'true');
  await expect(page.locator('[data-solution="site"][data-glass-card]')).toHaveAttribute('data-stack-progress');
}

async function seek(page: Page, id: string) {
  await page.evaluate(id => {
    const stage = document.querySelector<HTMLElement>('[data-ecosystem-stage]')!;
    const card = stage.querySelector<HTMLElement>(`[data-glass-card][data-solution="${id}"]`)!;
    window.scrollTo({ top: Number(stage.dataset.stackStart) + (Number(stage.dataset.stackEnd) - Number(stage.dataset.stackStart)) * Number(card.dataset.stackProgress), behavior: 'instant' });
  }, id);
  await expect(page.locator(`[data-glass-card][data-solution="${id}"]`)).toHaveAttribute('data-active', 'true');
  await page.waitForTimeout(800);
}

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  test(`all seven scenes fit and preserve their palette at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await open(page);
    for (const id of ids) {
      await seek(page, id);
      const card = page.locator(`[data-glass-card][data-solution="${id}"]`);
      const layout = await card.evaluate(card => {
        const box = card.getBoundingClientRect();
        const frame = card.closest('[data-ecosystem-viewport]')!.getBoundingClientRect();
        const intro = card.querySelector<HTMLElement>('[data-card-intro]')!;
        const visual = card.querySelector('[data-card-visual]')!.getBoundingClientRect();
        const heading = card.querySelector('h3')!.getBoundingClientRect();
        const titleWords = [...card.querySelectorAll('h3 > span')].map(word => word.getBoundingClientRect());
        const criticalSelectors: Record<string, string> = { site: '[data-web-image] strong', easychat: '[data-preview="easychat"] strong', suporte: '[data-support-answer] p' };
        const critical = criticalSelectors[(card as HTMLElement).dataset.solution!];
        const textFits = !critical || [...card.querySelectorAll(critical)].every(element => {
          const range = document.createRange(); range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          const clipping = element.closest('[data-web-image], [class*="chatHeader"], [data-preview]')!.getBoundingClientRect();
          return text.top >= clipping.top - 1 && text.bottom <= clipping.bottom + 1;
        });
        return {
          fits: box.top >= frame.top - 1 && box.bottom <= frame.bottom + 1,
          introFits: intro.getBoundingClientRect().bottom <= box.bottom && intro.scrollWidth <= intro.clientWidth + 1,
          visualFits: visual.top >= box.top && visual.bottom <= box.bottom,
          titleFits: titleWords.every(word => word.left >= heading.left - 1 && word.right <= heading.right + 1),
          textFits,
          overflow: document.documentElement.scrollWidth > innerWidth,
          animations: card.getAnimations({ subtree: true }).length,
          color: getComputedStyle(card).backgroundColor,
        };
      });
      expect(layout.fits, id).toBe(true);
      expect(layout.introFits, id).toBe(true);
      expect(layout.visualFits, id).toBe(true);
      expect(layout.titleFits, id).toBe(true);
      expect(layout.textFits, `${id}: actual text remains inside its clipping ancestor`).toBe(true);
      expect(layout.overflow, id).toBe(false);
      expect(layout.animations, id).toBe(0);
      const colors: Record<string, string> = { site: 'rgb(255, 120, 187)', menu: 'rgb(185, 239, 117)', nfc: 'rgb(0, 0, 0)', portfolio: 'rgb(209, 197, 241)', landing: 'rgb(246, 232, 169)', easychat: 'rgb(185, 220, 243)', suporte: 'rgb(185, 239, 117)' };
      expect(layout.color, id).toBe(colors[id]);
    }
    await expect(page.locator('[data-solution="easychat"]')).toContainText('Em desenvolvimento');
    expect(errors).toEqual([]);
  });
}

test('fast reversals return to the same NFC geometry and scrolling causes no layout resizes', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page);
  await seek(page, 'nfc');
  const geometry = () => page.locator('[data-solution="nfc"] [data-nfc-phone]').evaluate(phone => {
    const r = phone.getBoundingClientRect(), card = phone.closest('[data-glass-card]')!.getBoundingClientRect();
    return { x: r.x - card.x, y: r.y - card.y, width: r.width, height: r.height, opacity: getComputedStyle(phone).opacity };
  });
  const initial = await geometry();
  const result = await page.evaluate(async () => {
    const stage = document.querySelector<HTMLElement>('[data-ecosystem-stage]')!;
    let resizes = -1;
    const observer = new ResizeObserver(() => resizes++);
    observer.observe(stage.querySelector('[data-ecosystem-viewport]')!);
    await new Promise(requestAnimationFrame);
    for (const id of ['landing', 'site', 'suporte', 'menu', 'portfolio', 'site', 'nfc']) {
      const card = stage.querySelector<HTMLElement>(`[data-glass-card][data-solution="${id}"]`)!;
      window.scrollTo({ top: Number(stage.dataset.stackStart) + (Number(stage.dataset.stackEnd) - Number(stage.dataset.stackStart)) * Number(card.dataset.stackProgress), behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 45));
    }
    await new Promise(resolve => setTimeout(resolve, 900));
    observer.disconnect();
    return { resizes };
  });
  const final = await geometry();
  for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(final[key] - initial[key]), key).toBeLessThan(1);
  expect(final.opacity).toBe(initial.opacity);
  expect(result.resizes).toBe(0);
  await expect(page.locator('.pin-spacer:has(> [data-ecosystem-stage])')).toHaveCount(1);
});

test('menu categories work by pointer and keyboard without resizing the scene', async ({ page }) => {
  await open(page);
  await seek(page, 'menu');
  const card = page.locator('[data-glass-card][data-solution="menu"]');
  const before = await card.evaluate(el => el.getBoundingClientRect().height);
  await card.getByRole('button', { name: 'Cafés', exact: true }).click();
  await expect(card.getByText('Café coado', { exact: true })).toBeVisible();
  const sweets = card.getByRole('button', { name: 'Doces', exact: true });
  await sweets.focus();
  await page.keyboard.press('Enter');
  await expect(sweets).toHaveAttribute('aria-pressed', 'true');
  await expect(card.getByText('Brownie da casa', { exact: true })).toBeVisible();
  expect(await card.evaluate(el => el.getBoundingClientRect().height)).toBe(before);
});

test('native reduced motion removes the pin and restores it once when re-enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#ecossistema');
  const viewport = page.locator('[data-ecosystem-viewport]');
  await expect(viewport).toHaveAttribute('data-stack-reduced', 'true');
  await expect(page.locator('[data-glass-card]')).toHaveCount(7);
  await expect(page.locator('.pin-spacer:has(> [data-ecosystem-stage])')).toHaveCount(0);
  await expect(page.locator('[data-glass-card]').first()).toHaveCSS('transform', 'none');
  await expect(page.locator('[data-glass-card] [data-preview]')).toHaveCount(7);
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 20000 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('[data-ecosystem-stage]')).toHaveAttribute('data-scroll-cards', 'true', { timeout: 20000 });
  await expect(page.locator('.pin-spacer:has(> [data-ecosystem-stage])')).toHaveCount(1);
});
