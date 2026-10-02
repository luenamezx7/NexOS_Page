import { test, expect, type Page } from '@playwright/test';

async function openLanding(page: Page, theme: 'light' | 'dark' | 'system' = 'dark', skipIntro = true) {
  await page.addInitScript(({ theme, skipIntro }) => {
    if (skipIntro) sessionStorage.setItem('nexos-boot-seen', '1');
    if (theme !== 'system') localStorage.setItem('nexos-theme', theme);
    localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() }));
  }, { theme, skipIntro });
  await page.goto('/');
  if (skipIntro) await expect(page.getByRole('heading', { name: 'Seu negócio. Em outra escala.' })).toBeVisible();
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

test('spatial preview traps focus, responds to controls and returns focus on Escape', async ({ page }) => {
  await openLanding(page, 'light');
  const trigger = page.getByRole('button', { name: 'Explorar placa em preview 3D' });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Explore a placa.' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Fechar preview' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Restaurar vista' })).toBeFocused();
  const rotation = dialog.getByRole('slider', { name: 'Rotação horizontal' });
  await rotation.focus();
  await page.keyboard.press('ArrowRight');
  await expect(rotation).toHaveValue('-11');
  await dialog.getByRole('button', { name: 'Restaurar vista' }).click();
  await expect(rotation).toHaveValue('-12');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

test('service objectives filter the catalog and show payment cost before checkout', async ({ page }) => {
  await openLanding(page);
  const services = page.locator('#services');
  await services.getByRole('radio', { name: 'Quero vender', exact: true }).check();
  await expect(services.getByRole('heading', { name: 'Desenvolvimento NexOS' })).toBeVisible();
  await expect(services.getByRole('heading', { name: 'Teste de checkout' })).toHaveCount(0);
  await services.getByRole('radio', { name: 'Validar pagamentos', exact: true }).check();
  await expect(services).toContainText('custa R$ 5,00');
  await expect(services.getByRole('heading', { name: 'Teste de checkout' })).toBeVisible();
  await expect(services.getByRole('heading', { name: 'Desenvolvimento NexOS' })).toHaveCount(0);
  await services.getByRole('radio', { name: 'Explorar tudo', exact: true }).check();
  await expect(services.getByRole('article')).toHaveCount(2);
});

for (const theme of ['light', 'dark'] as const) {
  test(`${theme} mobile: hero CTAs fit, modal fits and page has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    await openLanding(page, theme);
    const cta = page.getByRole('button', { name: 'Iniciar Projeto', exact: true });
    const box = await cta.boundingBox();
    expect(box!.y + box!.height).toBeLessThan(740);
    await expect(page.getByRole('button', { name: theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Explorar placa em preview 3D' }).click();
    const dialog = page.getByRole('dialog');
    const bounds = await dialog.boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.width).toBeLessThanOrEqual(360);
    expect(bounds!.height).toBeLessThanOrEqual(740);
    await dialog.getByRole('button', { name: 'Fechar preview' }).click();
    await page.getByRole('radio', { name: 'Apresentar marca' }).check();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('system preference, manual theme persistence and reduced-motion intro', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await openLanding(page, 'system', false);
  await expect(page.getByRole('heading', { name: 'A performance que seu business merece.' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar para o site' }).click();
  await expect(page.getByRole('button', { name: 'Ativar modo escuro' })).toBeVisible();
  await page.getByRole('button', { name: 'Ativar modo escuro' }).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Seu negócio. Em outra escala.' })).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
});
