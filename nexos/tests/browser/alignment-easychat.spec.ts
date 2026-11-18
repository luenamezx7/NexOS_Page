import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const width of [320, 390, 768, 1440]) {
  test(`hero, headings and EasyChat scroll stay aligned at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect.poll(() => page.locator('#hero-title').evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThan(100);
    for (const selector of ['.hero-heading', '.hero-description', '.hero-actions']) {
      await expect.poll(() => page.locator(selector).evaluate(el => {
        const box = el.getBoundingClientRect();
        const hero = el.closest("#hero")!.getBoundingClientRect();
        return Math.abs(box.left + box.width / 2 - (hero.left + hero.width / 2));
      })).toBeLessThan(2);
    }
    await expect(page.locator('.hero-heading [data-typing-word] > span').first()).not.toBeEmpty();
    await expect.poll(() => page.locator('.hero-heading [data-typing-word] > span').first().evaluate(el => {
      const box = el.getBoundingClientRect();
      const hero = el.closest("#hero")!.getBoundingClientRect();
        return Math.abs(box.left + box.width / 2 - (hero.left + hero.width / 2));
    })).toBeLessThan(3);
    const alignment = await page.locator('#main-content h2, #main-content h3').evaluateAll(nodes => nodes.filter(node => !node.closest('dialog')).map(node => ({ id: node.id, align: getComputedStyle(node).textAlign })));
    expect(alignment.filter(item => item.align !== 'center')).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    const section = page.locator('#easychat');
    const phone = page.locator('[data-phone-scroll]');
    await expect.poll(() => phone.evaluate(el => el.style.top)).not.toBe('');
    await section.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .65, behavior: 'instant' }));
    await expect(page.locator('#easychat-title')).toHaveCSS('text-align', 'center');
    const before = await phone.evaluate(el => getComputedStyle(el).top);
    await section.evaluate(el => window.scrollTo({ top: scrollY + el.getBoundingClientRect().top + el.getBoundingClientRect().height * .5, behavior: 'instant' }));
    await expect.poll(() => phone.evaluate(el => getComputedStyle(el).top)).not.toBe(before);
    expect(await phone.evaluate(el => {
      const failures: string[] = [];
      for (let node: Element | null = el; node && node.id !== 'easychat'; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.transform !== 'none' || style.filter !== 'none' || style.perspective !== 'none') failures.push(node.className);
      }
      return failures;
    })).toEqual([]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('.landing-page')).toHaveAttribute('data-motion-detail', 'full');
    await expect.poll(() => phone.evaluate(el => el.style.top)).not.toBe('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  });
}

for (const width of [320, 390, 1440]) {
  test(`hero stays still through empty typewriter frames and automatic popups at ${width}px`, async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1800);
    await page.evaluate(() => window.scrollTo({ top: 120, behavior: 'instant' }));
    const result = await page.evaluate(async () => {
      const samples: number[][] = [];
      const words = new Set<string>();
      const popups = new Set<string>();
      for (let i = 0; i < 280; i++) {
        const title = document.querySelector('#hero-title')!.getBoundingClientRect();
        const copy = document.querySelector('.hero-description')!.getBoundingClientRect();
        const actions = document.querySelector('.hero-actions')!.getBoundingClientRect();
        const hero = document.querySelector('#hero')!.getBoundingClientRect();
        const word = document.querySelector('[data-typing-word] > span')!;
        words.add(word.textContent ?? '');
        popups.add(document.querySelector('[data-popup-copy]')!.textContent ?? '');
        samples.push([scrollY, title.top, title.height, copy.top, actions.top, hero.height]);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      return {
        ranges: samples[0].map((_, index) => Math.max(...samples.map(s => s[index])) - Math.min(...samples.map(s => s[index]))),
        emptyFrame: words.has(''), wordCount: words.size, popupCount: popups.size,
      };
    });
    expect(result.emptyFrame).toBe(true);
    expect(result.wordCount).toBeGreaterThan(5);
    expect(result.popupCount).toBeGreaterThan(1);
    for (const range of result.ranges) expect(range).toBeLessThan(1);
    const selectors = ['#delivery-process header p', '#cta-final [class*="ctaBottom"] > p', '#testimonials [class*="body"] p', '#ecossistema [class*="note"]'];
    for (const selector of selectors) {
      for (const paragraph of await page.locator(selector).all()) {
        await expect(paragraph).toHaveCSS('text-align', 'center');
      }
    }
  });
}
