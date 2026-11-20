import { expect, test, type Page } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.setTimeout(60000);

async function openHome(page: Page) {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
  await page.goto('/');
  await enterPresentation(page);
  await expect(page.locator('#hero-title')).toHaveCSS('opacity', '1');
  await expect(page.locator('.hero-copy')).toHaveCSS('opacity', '1');
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#real-estate-video-title [data-scroll-fill-word]').first()).toBeAttached();
}

async function scrollHeadingTo(page: Page, selector: string, viewportFraction: number) {
  await page.locator(selector).evaluate((heading, fraction) => {
    const top = heading.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top - innerHeight * fraction, behavior: 'instant' });
  }, viewportFraction);
}

for (const width of [1440, 390]) {
  test(`${width}px: content headings have one motion owner and video title fills in both directions`, async ({ page }) => {
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
    await expect(title).not.toHaveAttribute('data-heading-scroll');
    const opacity = () => title.locator('[data-scroll-fill-word]').first().evaluate(element => Number(getComputedStyle(element).opacity));
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
    })).toBeGreaterThan(.6);
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
    await expect(page.locator('#cta-title')).toHaveAttribute('data-scroll-fill-heading');
    await expect(page.locator('#cta-title')).not.toHaveAttribute('data-heading-scroll');
    await page.locator('#cta-title').evaluate(heading => scrollTo({ top: scrollY + heading.getBoundingClientRect().bottom - innerHeight * .35, behavior: 'instant' }));
    await expect.poll(() => page.locator('#cta-title [data-scroll-fill-word]').last().evaluate(element => Number(getComputedStyle(element).opacity))).toBeGreaterThan(.99);
  }
  await page.getByRole('banner').getByRole('link', { name: 'Entrar', exact: true }).click();
  await expect(page).toHaveURL(/\/portal\/acesso$/);
  await expect(page.locator('[data-heading-scroll]')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('[data-presentation]')).toHaveCount(0, { timeout: 15000 });
  await expect(page.locator('#faq-title')).toHaveAttribute('data-heading-scroll', 'ready');
  expect(errors).toEqual([]);
});
