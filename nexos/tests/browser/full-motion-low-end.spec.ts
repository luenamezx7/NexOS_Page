import { expect, test } from '@playwright/test';

for (const profile of [
  { name: 'weak PC', width: 1280, height: 720, cpu: 8, touch: false },
  { name: 'low-end touch device', width: 390, height: 844, cpu: 6, touch: true },
]) {
  test(`${profile.name}: motion continues with one core, low memory, CPU throttling and no WebGL`, async ({ browser, baseURL }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({ baseURL, viewport: { width: profile.width, height: profile.height }, hasTouch: profile.touch, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
      Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => 1 });
      Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 1 });
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, options?: object) {
        if (this.hasAttribute('data-gradient-canvas') && kind === 'webgl') return null;
        return Reflect.apply(getContext, this, [kind, options]);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: profile.cpu });
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0, { timeout: 25000 });
    await expect(page.locator('.landing-page')).toHaveAttribute('data-motion-detail', 'full');
    // The site does not falsify the browser's OS preference to achieve full motion.
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true);
    const word = page.locator('[data-typing-word] > span').first();
    const initial = await word.textContent();
    await expect.poll(() => word.textContent(), { timeout: 10000 }).not.toBe(initial);
    await expect.poll(() => page.locator('[data-hero-video] video').evaluate(el => (el as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(.1);
    await expect(page.locator('[data-management-stage]')).toHaveAttribute('data-management-motion', 'scroll');
    await page.locator('[data-management-stage]').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top + el.getBoundingClientRect().height * .65 - innerHeight * .25, behavior: 'instant' }));
    await expect(page.locator('[data-management-tab]').last()).toHaveAttribute('aria-pressed', 'true');
    const cards = page.locator('[data-ecosystem-stage]');
    await expect(cards).toHaveAttribute('data-scroll-cards', 'true');
    const range = await cards.evaluate(el => {
      const spacer = el.parentElement!;
      return { start: spacer.getBoundingClientRect().top + scrollY - Math.min(110, Math.max(80, Math.round(innerHeight * .25))), length: parseFloat(getComputedStyle(spacer).paddingBottom) };
    });
    await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), range.start + range.length * .6);
    await expect.poll(() => page.locator('[data-glass-card]').first().evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).a)).toBeLessThan(.95);
    await expect(page.locator('#ecossistema details, #ecossistema summary')).toHaveCount(0);
    const chat = page.locator('#easychat');
    const phone = page.locator('[data-phone-scroll]');
    await chat.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .65, behavior: 'instant' }));
    await expect.poll(() => phone.evaluate(el => el.style.top)).not.toBe('');
    const phoneBefore = await phone.evaluate(el => el.style.top);
    await chat.evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top + el.getBoundingClientRect().height * .5, behavior: 'instant' }));
    await expect.poll(() => phone.evaluate(el => el.style.top)).not.toBe(phoneBefore);
    await page.locator('#services').evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top + 200, behavior: 'instant' }));
    const wave = page.locator('[data-gradient-wave]');
    await expect(wave).toHaveAttribute('data-wave-state', 'fallback');
    await expect(wave).toHaveAttribute('data-wave-active', 'true');
    const fallback = wave.locator('span');
    const transform = await fallback.evaluate(el => getComputedStyle(el).transform);
    await expect.poll(() => fallback.evaluate(el => getComputedStyle(el).transform)).not.toBe(transform);
    await page.getByRole('button', { name: 'Ver solução: Landing page', exact: true }).click();
    await expect(page.locator('[data-macbook-slide][data-active="true"]')).toContainText('Uma pausa para o seu dia.');
    const portfolioVideo = page.locator('[aria-labelledby="real-estate-video-title"] video');
    await portfolioVideo.scrollIntoViewIfNeeded();
    await expect.poll(() => portfolioVideo.evaluate(el => (el as HTMLVideoElement).currentTime), { timeout: 15000 }).toBeGreaterThan(.1);
    for (let index = 0; index < 4; index++) {
      await page.evaluate(({ index, desktop }) => {
        const section = document.querySelector<HTMLElement>('#delivery-process')!;
        const timeline = section.querySelector('ol')!;
        const range = desktop ? section.offsetHeight - innerHeight : timeline.offsetHeight;
        const top = desktop ? section.getBoundingClientRect().top + scrollY : timeline.getBoundingClientRect().top + scrollY - innerHeight / 2;
        scrollTo({ top: top + range * ((index + .5) / 4), behavior: 'instant' });
      }, { index, desktop: profile.width >= 768 });
      await expect(page.locator('#delivery-process ol > li').nth(index)).toHaveAttribute('aria-current', 'step');
    }
    const support = page.locator('[data-tilted-grid]');
    await support.scrollIntoViewIfNeeded();
    await expect(support).toHaveAttribute('data-running', 'true');
    await expect.poll(() => support.evaluate(el => el.getAnimations({ subtree: true }).some(animation => animation.playState === 'running'))).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await context.close();
  });
}
