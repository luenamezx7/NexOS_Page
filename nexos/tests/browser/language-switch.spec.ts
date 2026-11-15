import { expect, test } from '@playwright/test';

// Prefer the bundled browser in CI; allow locally installed Chrome when it is unavailable.
test.use({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined });

test('switches the public site between Portuguese, English and Spanish, preserving the choice', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  const switcher = page.getByRole('banner').getByRole('button', { name: 'Selecionar idioma: Português' });
  await expect(switcher).toBeVisible();
  await expect(switcher.locator('img')).toHaveAttribute('src', '/flags/br.svg');
  await switcher.click();
  const english = page.getByRole('menuitem', { name: 'English' });
  await expect(english.locator('img')).toHaveAttribute('src', '/flags/us.svg');
  await expect(page.getByRole('menuitem', { name: 'Español' }).locator('img')).toHaveAttribute('src', '/flags/es.svg');
  await english.click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your business');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Select language: English' }).locator('img')).toHaveAttribute('src', '/flags/us.svg');
  await expect(page.locator('[data-hero-brand-strip]')).toContainText('Digital menus');
  await expect(page.locator('section[aria-labelledby="real-estate-video-title"]')).toContainText('Professional, immersive videos with AI.');
  const cookieNotice = page.getByRole('dialog', { name: 'Cookie notice' });
  await cookieNotice.getByRole('button', { name: 'Customize', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Cookie preferences', exact: true })).toContainText('Strictly necessary');
  await page.getByRole('button', { name: 'Close cookie preferences', exact: true }).click();


  await page.goto('/criacao-de-sites');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('A website worthy of your business.');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Select language: English' })).toBeVisible();

  await page.getByRole('banner').getByRole('button', { name: 'Select language: English' }).click();
  await page.getByRole('menuitem', { name: 'Español' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Un sitio a la altura de tu negocio.');
  await expect(page.getByRole('banner').getByRole('button', { name: 'Seleccionar idioma: Español' }).locator('img')).toHaveAttribute('src', '/flags/es.svg');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Un sitio a la altura de tu negocio.');

  await page.goto('/');
  await expect(page.locator('[data-hero-brand-strip]')).toContainText('Menús digitales');
  await expect(page.locator('section[aria-labelledby="real-estate-video-title"]')).toContainText('Vídeos profesionales e inmersivos con IA.');
  await expect(page.locator('#cta-final a[href*="wa.me"]')).toHaveAttribute('href', /Hola/);

  for (const [path, headline] of [
    ['/landing-pages', 'Una página. Una oferta clara.'],
    ['/cardapio-digital', 'Tu menú, en la pantalla del cliente.'],
    ['/placa-nfc', 'Acerca. Escanea. Conecta.'],
  ]) {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(headline);
  }

  await page.goto('/privacidade');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Política de Privacidade');
  await expect(page.getByRole('banner').getByRole('button', { name: /Seleccionar idioma/ })).toHaveCount(0);

  await page.goto('/placa-nfc');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.getByRole('banner').getByRole('button', { name: 'Seleccionar idioma: Español' }).click();
  await page.getByRole('menuitem', { name: 'Português' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Aproxime. Escaneie. Conecte.');
});

test('keeps the language switch accessible without horizontal overflow', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  await page.goto('/');
  for (const width of [390, 1024, 1199, 1200, 1366]) {
    await page.setViewportSize({ width, height: 850 });
    await expect(page.getByRole('banner').getByRole('button', { name: 'Selecionar idioma: Português' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width < 1200) {
      await page.getByRole('banner').getByRole('button', { name: 'Abrir menu' }).click();
      await expect(page.getByRole('navigation', { name: 'Navegação móvel' })).toBeVisible();
      await page.keyboard.press('Escape');
    }
  }
});

test('keeps current brand accents and localized hero content in all three languages', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  await expect(intro).toHaveCount(0, { timeout: 15000 });
  await expect(page.getByRole('banner').locator('[data-brand-way]')).toHaveText('way');
  await expect(page.getByRole('banner').locator('[data-wordmark]')).toHaveText('ez');
  await expect(page.getByRole('banner').locator('[data-brand-way]')).toHaveCSS('color', 'rgb(255, 63, 159)');

  for (const [locale, sentence, next] of [
    ['pt', 'Seu negócio conectado em uma aproximação', 'English'],
    ['en', 'Your business connected with a single tap', 'Español'],
    ['es', 'Tu negocio conectado con un solo toque', null],
  ] as const) {
    await expect(page.locator('#hero-title')).toHaveAttribute('aria-label', sentence);
    await expect(page.locator('#hero [data-typing-word]')).toBeVisible();
    await expect(page.locator('#hero [data-typing-word] > span').first()).toHaveCSS('background-image', /linear-gradient/);
    await expect(page.getByRole('banner').locator('a[href*="wa.me"]')).toHaveCSS('background-color', 'rgb(255, 63, 159)');
    await expect(page.locator('#hero a[href="#showcase"]')).toHaveCSS('background-color', 'rgb(255, 63, 159)');
    if (next) {
      const label = locale === 'pt' ? 'Selecionar idioma: Português' : 'Select language: English';
      await page.getByRole('banner').getByRole('button', { name: label }).click();
      await page.getByRole('menuitem', { name: next }).click();
    }
  }
  await expect(page.locator('#brand-closing h2')).toHaveCSS('background-image', /linear-gradient/);
  await expect(page.locator('#brand-closing')).toContainText('Hecho por ezway');

  for (const width of [390, 1366]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator('#easychat').scrollIntoViewIfNeeded();
    const phone = page.locator('#easychat [data-iphone15pro]');
    await phone.scrollIntoViewIfNeeded();
    await expect(phone.locator('img')).toHaveAttribute('src', '/mockups/iphone-15-pro.svg');
    expect(await phone.evaluate(el => {
      const viewport = el.firstElementChild!;
      const content = viewport.firstElementChild!;
      const media = viewport.getBoundingClientRect();
      const screen = content.getBoundingClientRect();
      const input = content.lastElementChild!.getBoundingClientRect();
      return Math.abs(media.left - screen.left) < 1 && Math.abs(media.top - screen.top) < 1 &&
        Math.abs(media.width - screen.width) < 1 && Math.abs(media.height - screen.height) < 1 &&
        input.bottom <= screen.bottom && input.top >= screen.top;
    })).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('fills the green top progress line when scrolling and resets at the start', async ({ page }) => {
  await page.goto('/');
  const intro = page.locator('dialog[data-presentation]');
  if (await intro.isVisible()) await intro.getByRole('button', { name: 'Pular apresentação' }).click();
  await expect(intro).toHaveCount(0);
  const progress = page.getByRole('progressbar', { name: 'Progresso da página' });
  await expect(progress).toBeVisible();
  await expect(page.locator('#hero .hero-actions a').first()).toHaveCSS('background-color', 'rgb(255, 63, 159)');
  await expect(progress.locator('div')).toHaveCSS('background-color', 'rgb(34, 197, 94)');
  await expect(page.getByRole('navigation', { name: 'Navegação de seções' })).toHaveCount(0);
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeGreaterThan(95);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await expect.poll(async () => Number(await progress.getAttribute('aria-valuenow'))).toBeLessThan(5);
});

test('keeps headings and body copy within mobile and desktop layouts in every language', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('nexos-boot-seen', '1'));
  for (const locale of ['pt', 'en', 'es']) {
    await page.goto('/');
    if (locale !== 'pt') {
      await page.getByRole('banner').getByRole('button', { name: /idioma|language|idioma/i }).click();
      await page.getByRole('menuitem', { name: locale === 'en' ? 'English' : 'Español' }).click();
    }
    for (const width of [390, 1366]) {
      await page.setViewportSize({ width, height: 844 });
      for (const path of ['/', '/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/placa-nfc']) {
        await page.goto(path);
        await expect(page.locator('main h1').first()).toBeVisible();
        expect(await page.evaluate(() => {
          const headings = [...document.querySelectorAll('main h1, main h2, main h3')];
          return document.documentElement.scrollWidth <= innerWidth + 1 && headings.every(heading => {
            const { left, right, width } = heading.getBoundingClientRect();
            return width > 0 && left >= -1 && right <= innerWidth + 1;
          });
        }), `${locale} ${width}px ${path}`).toBe(true);
      }
    }
  }
});
