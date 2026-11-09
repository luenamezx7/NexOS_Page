import { expect, test } from '@playwright/test';

async function openHome(page: import('@playwright/test').Page) {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const cookieNotice = page.getByRole('dialog', { name: 'Aviso de cookies' });
  await cookieNotice.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await cookieNotice.isVisible()) {
    await cookieNotice.getByRole('button', { name: 'Recusar', exact: true }).click();
    await expect(cookieNotice).toBeHidden();
  }
}

async function showServiceStep(page: import('@playwright/test').Page, index: number) {
  const grid = page.locator('#services [data-services-journey]');
  await expect(grid).toHaveAttribute('data-motion-ready', 'true');
  await grid.evaluate((element, step) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + (element.clientHeight - innerHeight) * (step ? .95 : .05), behavior: 'instant' });
  }, index);
  await expect(page.locator('#services [data-macbook-slide]').nth(index)).toHaveAttribute('data-active', 'true');
}

for (const width of [320, 360, 390, 430]) {
  test(`${width}px: the typing word, animated bridge and MacBook stay within the viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await openHome(page);
    const heading = page.locator('#hero-title');
    const word = heading.locator('[data-typing-word]');
    await expect(word).toBeVisible();
    const result = await heading.evaluate(element => {
      const line = element.querySelector('.hero-title-line')!.getBoundingClientRect();
      const typed = element.querySelector('[data-typing-word]')!.getBoundingClientRect();
      return { delta: Math.abs(line.left - typed.left), right: typed.right };
    });
    expect(result.delta).toBeLessThan(2);
    expect(result.right).toBeLessThanOrEqual(width);
    await page.getByLabel('Da placa ao próximo passo').scrollIntoViewIfNeeded();
    const bridge = page.getByLabel('Da placa ao próximo passo');
    await expect.poll(() => bridge.locator('p').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await expect(bridge.locator('p [class*="word"]')).toHaveCount(5);
    const secondBridge = page.getByLabel('Menos tarefas. Mais negócio.');
    await secondBridge.scrollIntoViewIfNeeded();
    await expect.poll(() => secondBridge.locator('p').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    await showServiceStep(page, 0);
    await expect(page.locator('#services-title')).toBeVisible();
    await expect(page.locator('#services [data-macbook-slide]').first().getByRole('img', { name: 'Site ilustrativo de arquitetura' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('the section contains only its title and the two supplied images', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  await expect(page.locator('#services-title')).toHaveText('Sites para seu negócio, cardápios ou vídeos com IA?');
  await expect(page.locator('#services h3, #services p, #services a, #services button')).toHaveCount(0);
  await expect(page.locator('#services [data-macbook-slide]')).toHaveCount(2);
  await showServiceStep(page, 1);
  await expect(page.locator('#services [data-macbook-slide]').last().getByRole('img', { name: 'Cardápio ilustrativo de cafeteria' })).toBeVisible();
});

test('the MacBook loads only imgg1 and imgg2 at high quality', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const services = page.locator('#services');
  const images = services.locator('[data-macbook-slide] img');
  await expect(images).toHaveCount(2);
  for (const [index, filename] of ['imgg1', 'imgg2'].entries()) {
    await expect(images.nth(index)).toHaveAttribute('src', new RegExp(`${filename}.*\.png`));
    await expect(images.nth(index)).toHaveCSS('object-fit', 'cover');
    await expect.poll(() => images.nth(index).evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await expect(services.locator('img[class*="macbookFrame"]')).toHaveAttribute('src', '/mackbook_1.svg');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('animated bridge titles fit in English and Spanish on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await openHome(page);
  for (const [locale, phrases] of [
    ['en', ['From the plate to the next step', 'Fewer tasks. More business.']],
    ['es', ['De la placa al siguiente paso', 'Menos tareas. Más negocio.']],
  ] as const) {
    await page.evaluate(value => { localStorage.setItem('easyway-language', value); window.dispatchEvent(new Event('easyway-language-change')); }, locale);
    for (const phrase of phrases) {
      const bridge = page.getByLabel(phrase);
      await bridge.scrollIntoViewIfNeeded();
      await expect.poll(() => bridge.locator('p').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    }
  }
});

test('reduced motion shows every EasyChat message without waiting', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openHome(page);
  const easychat = page.locator('#easychat');
  await easychat.scrollIntoViewIfNeeded();
  await expect(easychat.getByText('Em desenvolvimento', { exact: true }).first()).toBeVisible();
  await expect(easychat.locator('[data-message-visible="true"]')).toHaveCount(4);
});

test('EasyChat screen stays unscaled and unfiltered during scroll', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const screen = page.locator('#easychat [class*="phoneScreen"]');
  await screen.scrollIntoViewIfNeeded();
  const title = page.locator('#easychat-title');
  const section = page.locator('#easychat');
  await page.evaluate(() => document.fonts.ready);
  await section.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - innerHeight * .65, behavior: 'instant' }));
  await expect(title).toBeVisible();
  await expect.poll(async () => {
    const titleBox = await title.boundingBox();
    const phoneBox = await screen.boundingBox();
    return titleBox && phoneBox ? phoneBox.y - (titleBox.y + titleBox.height) : -1;
  }).toBeGreaterThanOrEqual(0);
  const before = await screen.evaluate(element => parseInt(getComputedStyle(element.closest('figure')!.parentElement!).top, 10));
  await section.evaluate(element => window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top + element.getBoundingClientRect().height * .65, behavior: 'instant' }));
  await expect.poll(() => screen.evaluate(element => parseInt(getComputedStyle(element.closest('figure')!.parentElement!).top, 10))).not.toBe(before);
  for (const offset of [-200, 0, 200]) {
    await page.evaluate(delta => window.scrollBy(0, delta), offset);
    expect(await screen.evaluate(element => {
      const altered: string[] = [];
      for (let node: Element | null = element; node && node.id !== 'easychat'; node = node.parentElement) {
        const style = getComputedStyle(node);
        if (style.transform !== 'none' || style.filter !== 'none' || style.perspective !== 'none') altered.push(`${node.className}: ${style.transform} / ${style.filter} / ${style.perspective}`);
      }
      return altered;
    })).toEqual([]);
  }
});

test('EasyChat highlight follows both lines of the phrase', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openHome(page);
  const title = page.locator('#easychat-title');
  await title.scrollIntoViewIfNeeded();
  const highlight = title.locator('[data-highlight-ink]');
  await expect(highlight).toHaveText('Mais tempo para o negócio.');
  await expect.poll(() => highlight.evaluate(element => getComputedStyle(element).backgroundSize)).toBe('100% 100%');
  expect(await highlight.evaluate(element => {
    const style = getComputedStyle(element);
    return style.boxDecorationBreak === 'clone' && style.backgroundClip === 'border-box' && style.webkitTextFillColor !== 'rgba(0, 0, 0, 0)';
  })).toBe(true);
});

test('commercial pages fit small screens in all available languages', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript(() => localStorage.setItem('easyway-language', 'pt'));
  for (const locale of ['pt', 'en', 'es']) {
    for (const path of ['/placa-nfc', '/cardapio-digital', '/criacao-de-sites', '/landing-pages']) {
      await page.goto(path);
      await page.evaluate(value => { localStorage.setItem('easyway-language', value); window.dispatchEvent(new Event('easyway-language-change')); }, locale);
      await expect(page.locator('html')).toHaveAttribute('lang', locale === 'pt' ? 'pt-BR' : locale);
      await expect(page.locator('#service-heading')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} ${path}`).toBe(true);
    }
  }
});
