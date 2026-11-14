import { expect, test, type Page } from '@playwright/test';

test.setTimeout(60000);

async function openHome(page: Page) {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.goto('/');
  await expect(page.locator('#hero-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#real-estate-video-title')).toHaveAttribute('data-heading-scroll', 'ready');
}

async function scrollHeadingTo(page: Page, selector: string, viewportFraction: number) {
  await page.locator(selector).evaluate((heading, fraction) => {
    const top = heading.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top - innerHeight * fraction, behavior: 'instant' });
  }, viewportFraction);
}

for (const width of [1440, 390]) {
  test(`${width}px: every content heading is registered and video title follows scroll in both directions`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.landing-page h1, .landing-page h2, .landing-page h3, .landing-page h4, .landing-page h5, .landing-page h6')]
      .filter(heading => !heading.hasAttribute('data-heading-static') && !heading.closest('dialog, [aria-hidden="true"], .sr-only'))
      .every(heading => (heading as HTMLElement).dataset.headingScroll === 'ready'))).toBe(true);
    await expect(page.locator('#hero-title')).toHaveCSS('opacity', '1');
    await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
    await expect(page.locator('#hero-title')).not.toHaveAttribute('data-heading-scroll');
    const title = page.locator('#real-estate-video-title');
    const opacity = () => title.evaluate(element => Number(getComputedStyle(element).opacity));
    await scrollHeadingTo(page, '#real-estate-video-title', .96);
    await expect.poll(opacity).toBeLessThan(.3);
    await scrollHeadingTo(page, '#real-estate-video-title', .76);
    await expect.poll(opacity).toBeGreaterThan(.45);
    expect(await opacity()).toBeLessThan(.95);
    await scrollHeadingTo(page, '#real-estate-video-title', .5);
    await expect.poll(opacity).toBeGreaterThan(.99);
    await scrollHeadingTo(page, '#real-estate-video-title', .96);
    await expect.poll(opacity).toBeLessThan(.3);
    await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    const closingWordmark = page.locator('#brand-closing h2');
    await expect.poll(() => closingWordmark.evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.99);
    expect(await closingWordmark.evaluate(element => {
      const word = element.getBoundingClientRect();
      const section = element.closest('section')!.getBoundingClientRect();
      return (Math.min(word.bottom, section.bottom) - Math.max(word.top, section.top)) / word.height;
    })).toBeGreaterThan(.95);
    await page.locator('#brand-closing').screenshot({ path: `test-results/brand-closing-${width}.png` });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('language changes and route navigation rebuild heading motion without hiding content or runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openHome(page);
  for (const locale of ['en', 'es', 'pt']) {
    await page.evaluate(value => { localStorage.setItem('easyway-language', value); window.dispatchEvent(new Event('easyway-language-change')); }, locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : locale);
    await expect(page.locator('#cta-title')).toHaveAttribute('data-heading-scroll', 'ready');
    await scrollHeadingTo(page, '#cta-title', .5);
    await expect.poll(() => page.locator('#cta-title').evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.99);
  }
  await page.locator('footer a[href="/criacao-de-sites"]').first().click();
  await expect(page).toHaveURL(/\/criacao-de-sites$/);
  await expect(page.locator('[data-heading-scroll]')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#faq-title')).toHaveAttribute('data-heading-scroll', 'ready');
  expect(errors).toEqual([]);
});
