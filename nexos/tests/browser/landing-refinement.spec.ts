import { expect, test, type Page } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

test.use({ contextOptions: { reducedMotion: 'reduce' } });

async function openLanding(page: Page, theme = 'dark', presentation = false) {
  await page.addInitScript(theme => {
    localStorage.setItem('nexos-theme', theme);
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, theme);
  await page.goto(presentation ? '/' : '/#hero');
  if (presentation) await enterPresentation(page);
  await expect(page.locator('#hero-title')).toBeVisible();
}

test('presentation hands off without hydration errors; every landing section remains accessible', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLanding(page, 'dark', true);
  await expect(page.locator('.waves-entry')).toHaveCount(0);
  await expect(page.locator('#hero')).toBeFocused();
  const ids = ['hero', 'fisico-digital', 'metrics', 'showcase', 'services', 'delivery-process', 'testimonials', 'faq', 'mascot-solutions', 'cta-final'];
  for (const id of ids) {
    await expect(page.locator(`#${id}`)).toHaveCount(1);
    expect(await page.locator(`#${id}`).evaluate(el => Boolean(el.closest('[aria-hidden="true"]'))), id).toBe(false);
  }
  const broken = await page.locator('a[href^="#"]').evaluateAll(links => links.map(link => link.getAttribute('href')!).filter(href => href.length > 1 && !document.getElementById(href.slice(1))));
  expect(broken).toEqual([]);
  expect(errors).toEqual([]);
});

test('hero owns ASCII, light waves alternate, and dark surfaces follow the theme', async ({ page }) => {
  await openLanding(page, 'light');
  await expect(page.locator('#hero .gradient-ascii-canvas')).toHaveAttribute('data-motion', 'static');
  expect(await page.locator('#hero .gradient-ascii-canvas').evaluate(el => (el as HTMLCanvasElement).getContext('webgl2')?.isContextLost())).toBe(false);
  await expect(page.locator('#hero .topography-container')).toHaveCount(0);
  await expect(page.locator('.site-atmosphere')).toHaveCount(0);
  await page.locator('#fisico-digital').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-scene="waves"] canvas').first()).toBeVisible();
  const backgrounds = async () => page.locator('[data-tone]').evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
  const light = await backgrounds();
  expect(light[0]).not.toBe(light[1]);
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await expect.poll(async () => (await backgrounds())[0]).toBe('rgb(0, 0, 0)');
  const dark = await backgrounds();
  expect(dark[1]).not.toBe(dark[0]);
  expect(dark[1]).not.toBe(light[1]);
  await expect(page.locator('[data-scene="waves"] canvas')).toHaveCount(0);
});

test('demonstration charts change period and product/service timeline changes its steps', async ({ page }) => {
  await openLanding(page);
  const metrics = page.locator('#metrics');
  await expect(metrics).toContainText('NÃO REPRESENTAM RESULTADOS DA NEXOS');
  await metrics.getByRole('radio', { name: '90 dias' }).check();
  await expect(metrics.getByRole('img', { name: /90 dias/ })).toBeVisible();
  await expect(metrics).toContainText('1.842');
  await metrics.getByRole('radio', { name: '30 dias' }).check();
  await expect(metrics).toContainText('631');
  const process = page.locator('#delivery-process');
  await expect(process.getByRole('list', { name: 'Processo do produto físico' })).toBeVisible();
  await process.getByRole('radio', { name: 'Serviço digital' }).check();
  await expect(process.getByRole('list', { name: 'Processo do serviço digital' })).toBeVisible();
  await expect(process.getByRole('heading', { name: 'Publicação', exact: true })).toBeVisible();
  await process.getByRole('radio', { name: 'Produto físico' }).check();
  await expect(process.getByRole('heading', { name: 'Personalização', exact: true })).toBeVisible();
});

test('illustrative plate cards stay visible while quantity and commercial message stay tied to the real catalog', async ({ page }) => {
  await openLanding(page, 'light');
  const showcase = page.locator('#showcase');
  const total = showcase.getByTestId('plate-total');
  await expect(total).toHaveText(/69,90/);
  await showcase.getByRole('button', { name: 'Aumentar quantidade' }).click();
  const commercial = showcase.getByRole('link', { name: 'Adquirir Placa' });
  const href = await commercial.getAttribute('href');
  expect(new URL(href!).searchParams.get('text')).toContain('2 Placas Inteligentes NexOS');
  await expect(total).toHaveText(/139,80/);
  await expect(showcase.locator('img')).toHaveCount(0);
  await expect(showcase.getByRole('group', { name: 'Prévias visuais da placa' }).getByRole('radio')).toHaveCount(3);
  await showcase.getByRole('radio', { name: /Violeta digital/ }).check();
  await expect(showcase).toContainText('Violeta digital: prévia ilustrativa');
  await expect(total).toHaveText(/139,80/);
  await expect(commercial).toHaveAttribute('href', href!);
  await showcase.getByRole('button', { name: 'Explorar placa em preview 3D' }).click();
  const dialog = page.getByRole('dialog', { name: 'Explore a placa.' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('FAQ, mascot photo strip and final commercial CTA remain usable without a contact form', async ({ page }) => {
  await openLanding(page, 'light');
  const faq = page.locator('#faq');
  await faq.locator('summary').nth(2).click();
  await expect(faq.locator('details[open]')).toHaveCount(1);
  await expect(faq.locator('details').nth(2).locator('p')).toBeVisible();
  await expect(page.locator('#cta-final').getByRole('link', { name: 'Conversar com a NexOS' })).toHaveAttribute('href', /^https:\/\/wa.me\//);
  await expect(page.locator('#contact')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Enviar projeto', exact: true })).toHaveCount(0);
  await expect(page.locator('#mascot-solutions li')).toHaveCount(4);
  expect(await page.evaluate(() => !!(document.querySelector('#mascot-solutions')!.compareDocumentPosition(document.querySelector('#cta-final')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
});

for (const theme of ['light', 'dark']) {
  test(`${theme}: responsive layout, fan and blur do not obstruct controls`, async ({ page }) => {
    test.setTimeout(90000);
    await openLanding(page, theme);
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of ['hero', 'metrics', 'showcase', 'delivery-process', 'faq', 'mascot-solutions', 'cta-final']) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        const leaks = await page.locator(`#${id}`).evaluate(root => [...root.querySelectorAll('h1,h2,h3,a,button,label,svg[role="img"]')].filter(el => {
          // Content may extend inside the intentionally horizontal photo strip.
          let parent = el.parentElement;
          while (parent && parent !== root) {
            if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) return false;
            parent = parent.parentElement;
          }
          const box = el.getBoundingClientRect();
          return box.width > 0 && (box.left < -1 || box.right > innerWidth + 1);
        }).map(el => el.textContent?.trim().slice(0, 60)));
        expect(leaks, `${id} @${width}`).toEqual([]);
      }
      await page.locator('#showcase').getByRole('radio', { name: /Monocromático/ }).check();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    const blur = page.locator('.landing-edge-blur');
    await expect(blur).toHaveCSS('pointer-events', 'none');
    const topBlur = page.locator('.landing-header-blur');
    await expect(topBlur).toHaveCSS('position', 'fixed');
    await expect(topBlur).toHaveCSS('pointer-events', 'none');
    expect(Number(await topBlur.evaluate(el => getComputedStyle(el).zIndex))).toBeLessThan(Number(await page.getByRole('banner').evaluate(el => getComputedStyle(el).zIndex)));
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(blur).toHaveAttribute('data-hidden', 'true');
  });
}
