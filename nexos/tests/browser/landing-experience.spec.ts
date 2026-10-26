import { test, expect, type Page } from '@playwright/test';
import { enterPresentation } from './helpers/presentation';

async function openLanding(page: Page, theme: 'light' | 'dark' | 'system' = 'dark', skipIntro = true) {
  await page.addInitScript(({ theme, skipIntro }) => {
    if (skipIntro) sessionStorage.setItem('nexos-boot-seen', '1');
    if (theme !== 'system') localStorage.setItem('nexos-theme', theme);
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, { theme, skipIntro });
  await page.goto(skipIntro ? '/#hero' : '/');
  if (skipIntro) {
    await expect(page.locator('#hero-title')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aumentar quantidade' })).toBeEnabled();
  }
}

test('plate quiz preserves answers on back, produces a contextual result and resets', async ({ page }) => {
  await openLanding(page);
  const quiz = page.getByRole('complementary', { name: 'Descubra como usar sua placa' });
  await expect(quiz.getByRole('button', { name: 'Continuar' })).toBeDisabled();
  await quiz.getByRole('radio', { name: /Meu cardápio/ }).check();
  await quiz.getByRole('button', { name: 'Continuar' }).click();
  await quiz.getByRole('radio', { name: /Nas mesas/ }).check();
  await quiz.getByRole('button', { name: 'Voltar' }).click();
  await expect(quiz.getByRole('radio', { name: /Meu cardápio/ })).toBeChecked();
  await quiz.getByRole('button', { name: 'Continuar' }).click();
  await expect(quiz.getByRole('radio', { name: /Nas mesas/ })).toBeChecked();
  await quiz.getByRole('button', { name: 'Ver sugestão' }).click();
  await expect(quiz.getByRole('heading', { name: 'Cardápio conectado' })).toBeFocused();
  await expect(quiz).toContainText('Nas mesas');
  const link = await quiz.getByRole('link', { name: 'Personalizar minha placa' }).getAttribute('href');
  expect(new URL(link!).searchParams.get('text')).toContain('cardápio conectado para mesas');
  await quiz.getByRole('button', { name: 'Refazer quiz' }).click();
  await expect(quiz.getByRole('button', { name: 'Continuar' })).toBeDisabled();
});

test('service objectives explain development and lead to the commercial team', async ({ page }) => {
  await openLanding(page);
  const services = page.locator('#services');
  await services.getByRole('radio', { name: 'Quero vender', exact: true }).check();
  await expect(services.getByRole('heading', { name: 'Desenvolvimento NexOS' })).toBeVisible();
  await expect(services.getByRole('heading', { name: 'Teste de checkout' })).toHaveCount(0);
  await expect(services.getByRole('radio', { name: 'Validar pagamentos', exact: true })).toHaveCount(0);
  await services.getByRole('radio', { name: 'Apresentar marca' }).check();
  await expect(services).toContainText('Sua marca, bem apresentada.');
  await expect(services.getByRole('link', { name: 'Falar com o comercial' })).toHaveAttribute('href', /^https:\/\/wa.me\//);
  await services.getByRole('radio', { name: 'Explorar tudo', exact: true }).check();
  await expect(services.getByRole('article')).toHaveCount(1);
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} mobile: hero CTAs fit and page has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openLanding(page, theme);
    const cta = page.getByRole('link', { name: 'Entrar em contato', exact: true });
    const box = await cta.boundingBox();
    expect(box!.y + box!.height).toBeLessThan(740);
    await expect(page.getByRole('button', { name: theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('radio', { name: 'Apresentar marca' }).check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('system preference, manual theme persistence and reduced-motion home', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await openLanding(page, 'system', false);
  await expect(page.locator('#hero-title')).toBeVisible();
  await enterPresentation(page);
  await expect(page.getByRole('button', { name: 'Ativar modo escuro' })).toBeVisible();
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await enterPresentation(page);
  await expect(page.locator('#hero-title')).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
