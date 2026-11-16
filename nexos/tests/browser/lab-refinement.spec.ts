import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const width of [320, 390, 600, 767, 768, 1280, 1440]) {
  test(`catalogue, continuous boundary and keyboard focus at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('#hero')).toBeFocused();
    await expect(page.locator('#hero')).toHaveCSS('outline-style', 'none');
    const plates = page.locator('#hero figure img');
    await expect(plates).toHaveCount(1);
    expect(await plates.evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await expect(page.locator('#hero figure')).toBeVisible();
    const geometry = await page.evaluate(() => {
      const hero = document.querySelector('#hero')!.getBoundingClientRect();
      const panel = document.querySelector('#hero figure')!.getBoundingClientRect();
      const copy = document.querySelector('.hero-copy')!.getBoundingClientRect();
      const button = document.querySelector('.hero-actions a')!.getBoundingClientRect();
      const title = document.querySelector('.hero-heading')!;
      const word = document.querySelector('[data-typing-word]')!;
      return { heroBottom: hero.bottom, panelTop: panel.top, panelCenter: panel.left + panel.width / 2, copyCenter: copy.left + copy.width / 2, copyBottom: copy.bottom, buttonCenter: button.left + button.width / 2, titleAlign: getComputedStyle(title).textAlign, wordAlign: getComputedStyle(word).textAlign, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(geometry.overflow).toBe(false);
    if (width < 1024) expect(geometry.panelTop).toBeGreaterThan(geometry.copyBottom);
    expect(geometry.titleAlign).toBe('left');
    expect(geometry.wordAlign).toBe('left');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.matches('a,button,input'))).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle)).not.toBe('none');
    for (const delta of [400, 400, -400, -400]) {
      const before = await page.evaluate(() => scrollY);
      await page.mouse.wheel(0, delta);
      await page.waitForTimeout(400);
      const after = await page.evaluate(() => scrollY);
      if (delta > 0) expect(after).toBeGreaterThanOrEqual(before);
      else expect(after).toBeLessThanOrEqual(before);
    }
    await expect(page.locator('.gradual-blur')).toHaveCount(2);
    expect(await page.locator('.gradual-blur').first().evaluate(el => getComputedStyle(el).pointerEvents)).toBe('none');
  });
}

test('support band pauses manually and offscreen and preserves messages with system reduce enabled', async ({ page }) => {
  await page.goto('/#mascot-solutions');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const band = page.locator('[data-tilted-grid]');
  await expect(band).toHaveAttribute('data-running', 'true');
  await page.getByRole('button', { name: 'Pausar animação', exact: true }).click();
  await expect(band).toHaveAttribute('data-running', 'false');
  await page.getByRole('button', { name: 'Retomar animação', exact: true }).click();
  await expect(band).toHaveAttribute('data-running', 'true');
  await page.locator('#hero').scrollIntoViewIfNeeded();
  await expect(band).toHaveAttribute('data-running', 'false');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#mascot-solutions').scrollIntoViewIfNeeded();
  await expect(band).toHaveAttribute('data-running', 'false');
  await expect(page.getByRole('region', { name: 'Suporte da ezway', exact: true })).toBeVisible();
  await expect(page.locator('#mascot-solutions li')).toHaveCount(4);
  await expect(page.locator('#mascot-solutions li').first()).toContainText('Vamos entender seu negócio.');
  await page.getByRole('button', { name: 'Pausar animação', exact: true }).click();
  await expect(band).toHaveAttribute('data-running', 'false');
});

test('MacBook chassis remains fixed while original screen contents change and reverse', async ({ page }) => {
  await page.goto('/#services');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const chassis = page.locator('[data-macbook-chassis]');
  const original = await chassis.evaluate(el => getComputedStyle(el).transform);
  await expect(chassis.locator('img[src="/mackbook_1.svg"]')).toHaveCount(1);
  const bounds: number[] = [];
  for (const progress of [0, .33, .66, 1, 0]) {
    await page.evaluate(progress => { const root = document.querySelector<HTMLElement>('#services')!; scrollTo({ top: root.getBoundingClientRect().top + scrollY + (root.offsetHeight - innerHeight) * progress, behavior: 'instant' }); }, progress);
    await page.waitForTimeout(900);
    expect(await chassis.evaluate(el => getComputedStyle(el).transform)).toBe(original);
    bounds.push(await chassis.evaluate(el => el.getBoundingClientRect().width));
  }
  expect(Math.max(...bounds) - Math.min(...bounds)).toBeLessThan(1);
  await expect(page.locator('[data-macbook-slide][data-active="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Ver exemplo: Cardápio digital' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Ver exemplo: Landing page' }).click();
  await expect(page.getByRole('button', { name: 'Ver exemplo: Landing page' })).toHaveAttribute('aria-pressed', 'true');
  expect(await chassis.evaluate(el => getComputedStyle(el).transform)).toBe(original);
});

test('support card text fits the artwork in Portuguese, English and Spanish', async ({ page }) => {
  await page.goto('/#mascot-solutions');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  const section = page.locator('#mascot-solutions');
  await section.scrollIntoViewIfNeeded();
  for (const locale of ['pt', 'en', 'es']) {
    await page.evaluate(value => {
      localStorage.setItem('easyway-language', value);
      window.dispatchEvent(new Event('easyway-language-change'));
    }, locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : locale);
    await expect(section.locator('li')).toHaveCount(4);
    const clipped = await section.evaluate(root => {
      const sources = new Set([...root.querySelectorAll('img')].map(image => image.src));
      const failures: string[] = [];
      for (const source of sources) {
        if (!source.startsWith('data:image/svg+xml')) continue;
        const parsed = new DOMParser().parseFromString(decodeURIComponent(source.slice(source.indexOf(',') + 1)), 'image/svg+xml');
        const svg = document.importNode(parsed.documentElement, true) as unknown as SVGSVGElement;
        svg.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;left:0;top:0;width:1200px;height:828px';
        document.body.append(svg);
        try {
          const view = svg.viewBox.baseVal;
          for (const text of svg.querySelectorAll('text')) {
            const box = text.getBBox();
            if (box.x < 0 || box.y < 0 || box.x + box.width > view.width || box.y + box.height > view.height) failures.push(text.textContent ?? '');
          }
        } finally { svg.remove(); }
      }
      return { images: sources.size, failures };
    });
    expect(clipped.images).toBeGreaterThanOrEqual(4);
    expect(clipped.failures, `${locale}: artwork must not clip support copy`).toEqual([]);
    await section.screenshot({ path: `test-results/support-${locale}.png` });
  }
});

for (const scale of [1, 1.25, 2]) {
  test(`hero boundary remains unoutlined at pixel density ${scale}`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 900 }, deviceScaleFactor: scale });
    try {
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
      await expect(page.locator('#hero')).toBeFocused();
      await expect(page.locator('#hero')).toHaveCSS('outline-style', 'none');
      await expect(page.locator('#hero')).toHaveCSS('border-bottom-width', '0px');
      await page.evaluate(() => scrollTo(0, document.querySelector('#hero')!.getBoundingClientRect().bottom + scrollY - 300));
      await page.waitForTimeout(300);
      await page.screenshot({ path: `test-results/boundary-dpr-${scale}.png` });
    } finally { await context.close(); }
  });
}

test('mobile menu reaches the product below the fixed header and restores keyboard focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await expect(page.locator('#mobile-navigation')).toBeVisible();
  await page.getByRole('navigation', { name: 'Navegação móvel', exact: true }).getByRole('link', { name: 'Placas', exact: true }).click();
  await expect(page.locator('#mobile-navigation')).not.toBeVisible();
  await expect(page).toHaveURL(/#showcase$/);
  await expect(page.locator('#showcase')).toBeFocused();
  await expect.poll(() => page.evaluate(() => {
    const header = document.querySelector('header[role="banner"]')!.getBoundingClientRect();
    return document.querySelector('#showcase')!.getBoundingClientRect().top - header.bottom;
  })).toBeGreaterThanOrEqual(14);
});
