import { expect, test } from '@playwright/test';

for (const [locale, start, next, send] of [
  ['pt', 'Começar quiz', 'Próxima pergunta', 'Enviar respostas'],
  ['en', 'Start quiz', 'Next question', 'Send answers'],
  ['es', 'Empezar cuestionario', 'Siguiente pregunta', 'Enviar respuestas'],
] as const) {
  test(`${locale}: contact details gate eight quiz questions and the lead is submitted once`, async ({ page }) => {
    await page.addInitScript(language => {
      localStorage.setItem('easyway-language', language);
      sessionStorage.setItem('nexos-boot-seen', '1');
    }, locale);
    await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
    const payloads: unknown[] = [];
    await page.route('**/api/contact', async route => {
      payloads.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true } });
    });
    await page.goto('/#contact');
    const section = page.locator('#contact');
    await expect(section.getByRole('group')).toHaveCount(0);
    await section.getByRole('button', { name: start }).click();
    await expect(section.getByRole('group')).toHaveCount(0);
    await section.locator('input[name="name"]').fill('Maria Silva');
    await section.locator('input[name="email"]').fill('maria@example.com');
    await section.locator('input[name="phone"]').fill('+55 11 99999-9999');
    await section.getByRole('button', { name: start }).click();
    for (let index = 0; index < 8; index++) {
      const choices = section.getByRole('group').getByRole('button');
      await expect(choices).toHaveCount(4);
      await expect(section.getByRole('button', { name: index === 7 ? send : next })).toBeDisabled();
      await choices.first().click();
      await section.getByRole('button', { name: index === 7 ? send : next }).click();
    }
    await expect(section.getByRole('status')).toBeVisible();
    expect(payloads).toHaveLength(1);
    expect(payloads[0]).toMatchObject({ name: 'Maria Silva', email: 'maria@example.com', phone: '+55 11 99999-9999' });
    expect((payloads[0] as { answers: unknown[] }).answers).toHaveLength(8);
  });
}
