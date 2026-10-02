import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium, expect } from '@playwright/test';

const SITE = 'https://nexoslab.online';
const CALLBACK = 'https://lgfttyeezviecfqbbmqk.supabase.co/auth/v1/callback';

test('produção: botões com ícones no login/cadastro chegam a Google e GitHub', { timeout: 120000 }, async () => {
  const browser = await chromium.launch();
  try {
    for (const mode of ['login', 'signup']) {
      for (const provider of ['google', 'github']) {
        const context = await browser.newContext();
        try {
          const page = await context.newPage();
          const host = provider === 'google' ? 'accounts.google.com' : 'github.com';
          let callback;
          page.on('request', request => {
            const url = new URL(request.url());
            if (request.isNavigationRequest() && url.hostname === host && url.searchParams.has('redirect_uri')) {
              callback = url.searchParams.get('redirect_uri');
            }
          });
          await page.goto(`${SITE}/portal/acesso`);
          if (mode === 'signup') await page.getByRole('button', { name: 'Criar uma conta', exact: true }).click();
          const group = page.getByRole('group', { name: mode === 'signup' ? 'Criar conta com provedor' : 'Entrar com provedor' });
          await expect(group).toHaveAttribute('data-social-auth-mode', 'supabase');
          const button = group.getByRole('button', { name: provider === 'google' ? 'Google' : 'GitHub', exact: true });
          await expect(button.locator(`[data-provider-icon="${provider}"]`)).toBeVisible();
          await button.click();
          await page.waitForURL(url => url.hostname === host, { timeout: 30000 });
          await page.waitForLoadState('domcontentloaded');
          assert.equal(callback, CALLBACK, `${mode}/${provider}: callback externo precisa ser o Supabase`);
          await expect(page.locator('body')).not.toContainText(/redirect_uri_mismatch|invalid_client|Access blocked|redirect_uri is not associated/i);
          if (provider === 'google') await expect(page.getByRole('textbox').first()).toBeVisible({ timeout: 15000 });
          else await expect(page.locator('input[name="login"]')).toBeVisible({ timeout: 15000 });
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
});
