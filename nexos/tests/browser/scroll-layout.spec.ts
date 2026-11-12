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
  test(`hero action and next section remain in flow at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openHome(page);
    const action = page.locator('#hero').getByRole('link', { name: 'Conhecer a Placa NFC' });
    const bridge = page.locator('[data-nfc-bridge]');
    const strip = page.locator('[data-hero-brand-strip]');
    await expect(action).toBeVisible();
    const actionBox = (await action.boundingBox())!;
    const stripBox = (await strip.boundingBox())!;
    const bridgeBox = (await bridge.boundingBox())!;
    expect(actionBox.y + actionBox.height).toBeLessThan(bridgeBox.y - 16);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (viewport.width < 768) {
      expect(await page.evaluate(() => document.documentElement.clientWidth)).toBe(viewport.width);
    }
    const heroBox = (await page.locator('#hero').boundingBox())!;
    expect(bridgeBox.y).toBeLessThan(heroBox.y + heroBox.height);
    const product = (await page.locator('[data-home-experience="nfc"]').boundingBox())!;
    expect(product.y).toBeGreaterThan(heroBox.y + heroBox.height);
    expect(product.y).toBeLessThan(bridgeBox.y + bridgeBox.height - 48);
    expect(stripBox.y).toBeGreaterThan(bridgeBox.y + bridgeBox.height);
    expect(stripBox.y).toBeGreaterThan(product.y);
    expect(await page.locator('[data-home-experience="nfc"]').evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))).toBe(viewport.width < 768 ? 24 : 32);
    expect(await page.locator('[data-home-experience="nfc"]').evaluate(element => getComputedStyle(element, '::before').maskImage)).toContain('120px');
    expect(await page.locator('#contact [role="group"]').count()).toBe(0);
    expect(await strip.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    const headerRadius = await page.locator('header[role="banner"]').evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius));
    expect(headerRadius).toBeGreaterThanOrEqual(26);
  });
}

test('mobile toolbar-height changes do not move the next section or reverse downward scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 740 });
  await openHome(page);
  const strip = page.locator('[data-hero-brand-strip]');
  const bridge = page.locator('[data-nfc-bridge]');
  const topBefore = await strip.evaluate(element => (element as HTMLElement).offsetTop);
  const bridgeBefore = await bridge.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.setViewportSize({ width: 390, height: 780 });
  const topAfter = await strip.evaluate(element => (element as HTMLElement).offsetTop);
  expect(Math.abs(topAfter - topBefore)).toBeLessThan(2);
  expect(Math.abs(await bridge.evaluate(element => element.getBoundingClientRect().top + scrollY) - bridgeBefore)).toBeLessThan(2);

  let previous = await page.evaluate(() => scrollY);
  for (let i = 0; i < 6; i += 1) {
    await page.mouse.wheel(0, 180);
    await page.waitForTimeout(180);
    const current = await page.evaluate(() => scrollY);
    expect(current).toBeGreaterThan(previous);
    previous = current;
  }
});

for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test(`continuous native scroll crosses the hero and strip at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openHome(page);
    const stripBottom = await page.locator('[data-hero-brand-strip]').evaluate(element => element.getBoundingClientRect().bottom + scrollY);
    const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let previous = await page.evaluate(() => scrollY);
    for (let i = 0; i < 10; i += 1) {
      await page.mouse.move(viewport.width / 2, viewport.height * 0.8);
      await page.mouse.wheel(0, 220);
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(previous);
      const current = await page.evaluate(() => scrollY);
      expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(pageHeight);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY)).not.toBe('hidden');
      previous = current;
    }
    expect(previous).toBeGreaterThan(stripBottom);
    expect(await page.locator('.landing-page .gradual-blur').count()).toBe(0);
  });
}

test('interior page header matches the rounded home header on mobile and desktop', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/privacidade');
    const header = page.locator('[data-page-header]');
    await expect(header).toBeVisible();
    const radius = await header.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius));
    expect(radius).toBe(width < 768 ? 26 : 30);
    const box = (await header.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
});

test('hero and strip stay anchored when only mobile viewport height changes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const position = () => page.evaluate(() => {
    const hero = document.querySelector('#hero')!.getBoundingClientRect();
    const strip = document.querySelector('[data-hero-brand-strip]')!.getBoundingClientRect();
    return { heroBottom: hero.bottom + scrollY, stripTop: strip.top + scrollY, viewport: visualViewport?.height };
  });
  const initial = await position();
  await page.setViewportSize({ width: 390, height: 760 });
  const smaller = await position();
  expect(smaller.viewport).not.toBe(initial.viewport);
  expect(Math.abs(smaller.heroBottom - initial.heroBottom)).toBeLessThan(2);
  expect(Math.abs(smaller.stripTop - initial.stripTop)).toBeLessThan(2);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(Math.abs((await position()).stripTop - initial.stripTop)).toBeLessThan(2);
  expect(await page.locator('[aria-label="Progresso da página"]').count()).toBe(0);
});

test('MacBook journey keeps its scroll length and vertical gesture responsive on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const journey = page.locator('#services');
  await journey.scrollIntoViewIfNeeded();
  const before = await journey.evaluate(element => ({ height: element.getBoundingClientRect().height, y: scrollY }));
  const first = await journey.locator('[data-arc-device]').first().evaluate(element => getComputedStyle(element).transform);
  await page.setViewportSize({ width: 390, height: 760 });
  expect(Math.abs((await journey.boundingBox())!.height - before.height)).toBeLessThan(2);
  let previous = await page.evaluate(() => scrollY);
  for (let i = 0; i < 4; i += 1) {
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(previous);
    previous = await page.evaluate(() => scrollY);
  }
  const after = await journey.locator('[data-arc-device]').first().evaluate(element => getComputedStyle(element).transform);
  expect(after).not.toBe(first);
  expect(await journey.locator('[data-arc-device]').first().evaluate(element => getComputedStyle(element).pointerEvents)).toBe('none');
});

test('MacBook journey returns to its first frame when scrolling upward', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const journey = page.locator('#services');
  const top = await journey.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => scrollTo(0, y), top + 40);
  await expect(journey.locator('[data-arc-device]').first()).toHaveAttribute('data-active', 'true');
  await page.evaluate(y => scrollTo(0, y), top + 1750);
  await expect(journey.locator('[data-arc-device]').first()).toHaveAttribute('data-active', 'false');
  await page.evaluate(y => scrollTo(0, y), top + 40);
  await expect(journey.locator('[data-arc-device]').first()).toHaveAttribute('data-active', 'true');
});

test('rounded MacBook stage remains sticky without clipping its caption', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const journey = page.locator('#services');
  const stage = journey.locator(':scope > div').first();
  const start = await journey.evaluate(element => element.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), start + 300);
  await expect.poll(() => stage.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);
  expect(await stage.evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))).toBe(24);
  expect(await stage.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  expect(await page.locator('#services [data-warp-ring]').count()).toBe(1);
  await expect(stage.locator('h3')).toBeVisible();
});

test('hero CTA navigation yields to a manual reverse scroll without snapping back', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  await page.locator('#hero').getByRole('link', { name: 'Conhecer a Placa NFC' }).click();
  await expect(page).toHaveURL(/#showcase$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(600);
  const destination = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -500);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(destination - 50);
  const after = await page.evaluate(() => scrollY);
  await page.waitForTimeout(1400);
  expect(await page.evaluate(() => scrollY)).toBeLessThanOrEqual(after + 2);
});

test('NFC arcs remain cumulative and motion stops outside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const bridge = page.locator('[data-nfc-bridge]');
  await expect(bridge).toHaveAttribute('data-visible', 'true');
  const waves = bridge.locator('span[class*="wave"]');
  await expect(waves).toHaveCount(3);
  await page.evaluate(() => scrollTo(0, 2500));
  await expect(bridge).toHaveAttribute('data-visible', 'false');
  expect(await waves.first().evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});

test('Instagram invitation is legible on light ground before the dark footer', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const social = page.locator('#instagram');
  const heading = social.getByRole('heading', { name: 'Visite nosso Instagram.' });
  const button = social.getByRole('link', { name: 'Visitar Instagram' });
  const colors = await page.evaluate(() => {
    const social = document.querySelector('#instagram')!;
    return {
      section: getComputedStyle(social).backgroundColor,
      heading: getComputedStyle(social.querySelector('h2')!).color,
      headingFill: getComputedStyle(social.querySelector('h2')!).webkitTextFillColor,
      button: getComputedStyle(social.querySelector('a')!).backgroundColor,
      footer: getComputedStyle(document.querySelector('footer')!).backgroundColor,
    };
  });
  expect(colors.section).not.toBe(colors.footer);
  expect(colors.headingFill).toBe('rgb(23, 23, 26)');
  expect(colors.button).toBe('rgb(36, 36, 40)');
  expect(await page.locator('footer').evaluate(element => parseFloat(getComputedStyle(element).borderTopLeftRadius))).toBe(24);
  expect(await page.locator('footer').evaluate(element => getComputedStyle(element, '::before').maskImage)).toContain('120px');
  await expect(heading).toBeVisible();
  await expect(button).toHaveAttribute('target', '_blank');
});

test('chapter phrases stay outside panels on black with readable text', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  await expect(page.locator('[data-chapter-guide]')).toHaveCount(2);
  for (const guide of await page.locator('[data-chapter-guide]').all()) {
    const colors = await guide.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, text: getComputedStyle(element.querySelector('h2')!).webkitTextFillColor }));
    expect(colors.background).toBe('rgb(9, 9, 11)');
    expect(colors.text).toBe('rgb(248, 247, 248)');
  }
});

test('light chapters use dark text while the MacBooks and final CTA remain dark', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  for (const selector of ['[data-home-experience="real-estate-video"]', '[data-home-experience="applications"]', '[data-home-experience="about"]', '[data-home-experience="easychat"]', '#proof', '#faq']) {
    const surface = page.locator(selector);
    const colors = await surface.evaluate(element => ({ background: getComputedStyle(element).backgroundColor, text: getComputedStyle(element).color }));
    expect(colors.background, selector).toBe('rgb(248, 248, 250)');
    expect(colors.text, selector).toBe('rgb(23, 23, 26)');
  }
  const easyChat = await page.locator('#easychat-title').evaluate(element => ({ color: getComputedStyle(element).color, fill: getComputedStyle(element).webkitTextFillColor }));
  expect(easyChat.fill).toBe('rgb(23, 23, 26)');
  const badge = await page.locator('#easychat [class*="statusBadge"]').first().evaluate(element => ({ background: getComputedStyle(element).backgroundColor, color: getComputedStyle(element).color }));
  expect(badge.background).toBe('rgb(255, 255, 255)');
  expect(badge.color).toBe('rgb(23, 23, 26)');
  const dots = await page.locator('#easychat [class*="statusBadge"] span[style*="background-color"]').evaluateAll(elements => elements.map(element => getComputedStyle(element).backgroundColor));
  expect(dots.length).toBeGreaterThan(0);
  for (const color of dots) expect(color).toBe('rgb(255, 63, 159)');
  await expect(page.locator('#faq details').first()).toHaveAttribute('open', '');
  const cta = await page.locator('#cta-final').evaluate(element => ({ background: getComputedStyle(element).backgroundColor, text: getComputedStyle(element).color }));
  expect(cta.background).not.toBe('rgb(248, 248, 250)');
  expect(cta.text).not.toBe('rgb(23, 23, 26)');
  expect(await page.locator('#services').evaluate(element => getComputedStyle(element.firstElementChild!).backgroundColor)).not.toBe('rgb(248, 248, 250)');
});

test('text reveals finish once without blur or scroll-linked replay', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const title = page.locator('#faq-title');
  await title.scrollIntoViewIfNeeded();
  await expect(title).toHaveAttribute('data-reveal-state', 'visible');
  expect(await title.evaluate(element => getComputedStyle(element).filter)).toBe('none');
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect(title).toHaveAttribute('data-reveal-state', 'visible');
  const heading = page.locator('[data-after-product="true"] h2');
  await heading.scrollIntoViewIfNeeded();
  expect(await heading.locator('span').first().evaluate(element => getComputedStyle(element).filter)).toBe('none');
});

test('EasyChat shows the iPhone 15 Pro mockup with the chat inside the screen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const device = page.locator('#easychat [data-iphone15pro]');
  await expect(device).toBeVisible();
  const frame = device.locator('img');
  await expect(frame).toHaveAttribute('src', '/mockups/iphone-15-pro.svg');
  const asset = await page.request.get('/mockups/iphone-15-pro.svg');
  expect(asset.ok()).toBe(true);
  const markup = await asset.text();
  expect(markup).not.toContain('base64');
  expect(markup).toContain('ezwayScreen');
  const conversation = device.locator('[class*="messageMeta"]').first();
  await expect(conversation).toBeVisible();
  const inside = await page.evaluate(() => {
    const device = document.querySelector('#easychat [data-iphone15pro]')!;
    const screen = device.firstElementChild!;
    const message = device.querySelector('[class*="messageMeta"]')!;
    const screenBox = screen.getBoundingClientRect();
    const messageBox = message.getBoundingClientRect();
    return messageBox.left >= screenBox.left && messageBox.right <= screenBox.right && messageBox.bottom <= screenBox.bottom;
  });
  expect(inside).toBe(true);
});

test('default selection uses the light pink highlight and EasyChat emphasises its promise', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const selection = await page.evaluate(() => {
    const rules: string[] = [];
    for (const sheet of document.styleSheets) {
      let list: CSSRuleList;
      try { list = sheet.cssRules; } catch { continue; }
      for (const rule of list) {
        if (rule instanceof CSSStyleRule && rule.selectorText.includes('::selection')) rules.push(rule.cssText);
      }
    }
    const soft = getComputedStyle(document.documentElement).getPropertyValue('--highlight-soft').trim();
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--highlight-ink').trim();
    return { rules, soft, ink };
  });
  expect(selection.rules.join(' ')).toContain('var(--highlight-soft)');
  expect(selection.soft).toBe('#ffe2f1');
  expect(selection.ink).toBe('#3a0a20');

  const title = page.locator('#easychat-title');
  await title.scrollIntoViewIfNeeded();
  const ink = title.locator('[data-highlight-ink]');
  await expect(ink).toHaveText('Mais tempo para o negócio.');
  const marker = await title.locator('[data-highlighted-text] > span').first().evaluate(element => getComputedStyle(element).backgroundColor);
  expect(marker).toMatch(/1 0\.6666\d* 0\.8470\d* \/ 0\.32/);
});

test('Warp Carousel ring keeps the MacBook stage pinned and reversible', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openHome(page);
  const journey = page.locator('#services');
  const stage = journey.locator(':scope > div').first();
  const top = await journey.evaluate(element => element.getBoundingClientRect().top + scrollY);
  const front = () => page.evaluate(() => {
    const cards = [...document.querySelectorAll<HTMLElement>('#services [data-warp-card]')];
    return cards.findIndex(card => card.dataset.active === 'true');
  });
  const transforms = () => page.evaluate(() => [...document.querySelectorAll('#services [data-warp-card]')].map(card => getComputedStyle(card).transform));

  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top + 200);
  await page.waitForTimeout(600);
  expect(await stage.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);
  expect(await front()).toBe(0);

  const before = await transforms();
  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top + 1600);
  await page.waitForTimeout(600);
  expect(await front()).not.toBe(0);
  expect(await transforms()).not.toEqual(before);
  expect(await stage.evaluate(element => Math.round(element.getBoundingClientRect().top))).toBe(0);

  await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top + 200);
  await page.waitForTimeout(600);
  expect(await front()).toBe(0);
  expect(await page.evaluate(() => document.querySelectorAll('#services [data-warp-card]').length)).toBe(4);
});

test('MacBooks keep their 3D angles without overlapping during the ring journey', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
    await openHome(page);
    const journey = page.locator('#services');
    const top = await journey.evaluate(element => element.getBoundingClientRect().top + scrollY);
    const distance = await journey.evaluate(element => element.offsetHeight - innerHeight);

    for (const fraction of [0.05, 0.18, 0.33, 0.5, 0.66, 0.82, 0.95]) {
      await page.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), top + distance * fraction);
      await page.waitForTimeout(550);
      const cards = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('#services [data-warp-card]')].map(card => {
        const bounds = card.getBoundingClientRect();
        return { left: bounds.left, right: bounds.right, opacity: parseFloat(getComputedStyle(card).opacity), transform: getComputedStyle(card).transform };
      }).filter(card => card.opacity > 0.3 && card.right > 0 && card.left < innerWidth).sort((a, b) => a.left - b.left));
      for (let index = 1; index < cards.length; index++) {
        expect(cards[index].left - cards[index - 1].right).toBeGreaterThanOrEqual(0);
      }
      if (width === 1440 && fraction === 0.33) {
        expect(cards.some(card => card.transform.startsWith('matrix3d('))).toBe(true);
      }
    }
  }
});

test('three emulated touch passes across the hero advance and return without reversing mid-gesture', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'CDP touch dispatch is Chromium-only; verify Safari on a real iPhone separately.');
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const page = await context.newPage();
    await openHome(page);
    const cdp = await context.newCDPSession(page);
    const send = (type: 'touchStart' | 'touchMove' | 'touchEnd', y: number) => cdp.send('Input.dispatchTouchEvent', {
      type, touchPoints: type === 'touchEnd' ? [] : [{ x: 190, y, id: 1, radiusX: 1, radiusY: 1, force: 1 }],
    });
    for (let pass = 0; pass < 3; pass += 1) {
      await page.evaluate(() => window.scrollTo({ top: 620, behavior: 'instant' }));
      for (const direction of [-1, 1]) {
        const start = direction === -1 ? 680 : 260;
        await send('touchStart', start);
        let previous = await page.evaluate(() => scrollY);
        for (let step = 1; step <= 12; step += 1) {
          await send('touchMove', start + direction * step * 34);
          await page.waitForTimeout(30);
          const current = await page.evaluate(() => scrollY);
          if (step > 1) {
            if (direction === -1) expect(current).toBeGreaterThanOrEqual(previous);
            else expect(current).toBeLessThanOrEqual(previous);
          }
          previous = current;
        }
        await send('touchEnd', start + direction * 408);
      }
    }
  } finally {
    await context.close();
  }
});
