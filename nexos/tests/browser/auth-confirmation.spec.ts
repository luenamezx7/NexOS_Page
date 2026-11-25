import { expect, test, type Page } from '@playwright/test';

const target = '/conta?section=security';
const successResponse = { token: 'ui-fixture', user: { id: 'ui-fixture' } };
async function credentials(page: Page) {
  await page.goto(`/portal/acesso?callbackUrl=${encodeURIComponent(target)}`);
  await page.getByLabel('E-mail', { exact: true }).fill('member@example.test');
  await page.getByLabel('Senha', { exact: true }).fill('valid-password');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('[data-resize-transition]').evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  await expect.poll(() => page.locator('[data-resize-transition]').evaluate(el => el.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
}
async function geometry(page: Page) {
  return page.locator('[data-auth-card]').evaluate(element => {
    const box = element.getBoundingClientRect(), css = getComputedStyle(element);
    return { x: box.x, y: box.y, width: box.width, height: box.height, background: css.background, border: css.borderColor, shadow: css.boxShadow };
  });
}
async function sameCentre(page: Page) {
  const centres = await page.locator('[data-auth-card]').evaluate(card => {
    const centre = (element: Element) => { const box = element.getBoundingClientRect(); return [box.x+box.width/2, box.y+box.height/2]; };
    return [centre(card), centre(card.querySelector('[data-auth-spinner]')!), centre(card.querySelector('[data-auth-check]')!)];
  });
  centres.slice(1).forEach(point => point.forEach((value, index) => expect(Math.abs(value-centres[0][index])).toBeLessThan(1)));
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/security/config', route => route.fulfill({ json: { required: false, configured: false, siteKey: '' } }));
  await page.route(`**${target}`, route => route.fulfill({ contentType: 'text/html', body: '<main>Destino autenticado</main>' }));
});

for (const width of [390, 1440]) {
  test(`real password response drives a centered confirmation without layout shift at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    let release!: () => void, calls=0;
    const pending = new Promise<void>(resolve => { release=resolve; });
    await page.route('**/api/auth/sign-in/email', async route => { calls++; await pending; await route.fulfill({ json: successResponse }); });
    await credentials(page);
    const before=await geometry(page);
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();
    const animation=page.locator('[data-auth-confirmation]');
    await expect(animation).toHaveAttribute('data-auth-confirmation','loading');
    await expect(page.locator('[data-auth-content]')).toHaveCSS('opacity','0');
    await expect(page.locator('[data-auth-content]')).toHaveAttribute('inert','');
    await sameCentre(page);
    expect(await geometry(page)).toEqual(before);
    await page.locator('form[data-credential-rejected]').evaluate(form => { (form as HTMLFormElement).requestSubmit(); (form as HTMLFormElement).requestSubmit(); });
    await page.waitForTimeout(1300);
    expect(calls).toBe(1);
    await expect(animation).toHaveAttribute('data-auth-confirmation','loading');
    await expect(page.locator('[data-auth-check]')).toHaveCSS('opacity','0');
    await page.screenshot({path:`/tmp/auth-loading-${width}.png`});
    const confirmedAt=Date.now(); release();
    await expect(animation).toHaveAttribute('data-auth-confirmation','success');
    await expect(page.locator('[data-auth-check-path]')).toHaveCSS('stroke-dashoffset',/^0(?:px)?$/);
    await expect(page.locator('[data-auth-check] circle')).toHaveCSS('fill','rgb(34, 197, 94)');
    await sameCentre(page);
    expect(await geometry(page)).toEqual(before);
    await page.screenshot({path:`/tmp/auth-confirmed-${width}.png`});
    await expect(page).toHaveURL(new RegExp('/conta\\?section=security$'));
    expect(Date.now()-confirmedAt).toBeGreaterThanOrEqual(1250);
  });
}

test('incorrect password restores the existing form and error, without success', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email', async route => {
    await new Promise(resolve => setTimeout(resolve, 350));
    await route.fulfill({ status:401,json:{code:'INVALID_EMAIL_OR_PASSWORD',message:'Invalid email or password'} });
  });
  await credentials(page);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','loading');
  await expect(page.locator('#login-feedback')).toContainText('E-mail ou senha incorretos');
  await expect(page.locator('[data-auth-confirmation]')).toHaveCount(0);
  await expect(page.getByLabel('E-mail',{exact:true})).toHaveValue('member@example.test');
  await expect(page.getByLabel('Senha',{exact:true})).toHaveValue('valid-password');
  await expect(page.locator('[data-auth-content]')).toHaveCSS('opacity','1');
  await expect(page.getByRole('button',{name:'Entrar',exact:true})).toBeEnabled();
  await expect(page).toHaveURL(/portal\/acesso/);
});

test('first factor requests MFA without showing confirmation; only verified MFA succeeds', async ({ page }) => {
  await page.route('**/api/auth/sign-in/email', route => route.fulfill({json:{twoFactorRedirect:true}}));
  let release!:()=>void;
  const pending=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/auth/two-factor/verify-totp',async route=>{await pending;await route.fulfill({json:successResponse});});
  await credentials(page); await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Verificação em duas etapas'})).toBeVisible();
  await expect(page.locator('[data-auth-confirmation="success"]')).toHaveCount(0);
  await page.getByLabel('Código do autenticador',{exact:true}).fill('123456');
  await page.getByRole('button',{name:'Confirmar acesso',exact:true}).click();
  await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','loading');
  release(); await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','success');
  await expect(page).toHaveURL(/\/conta\?section=security$/);
});

test('reduced motion keeps the real confirmation without spin, blur or scale',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/auth/sign-in/email',async route=>{await pending;await route.fulfill({json:successResponse});});
  await credentials(page); await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await expect(page.locator('[data-auth-content]')).toHaveCSS('filter','blur(0px)');
  const spinning=await page.locator('[data-auth-rotor]').evaluate(el=>el.getAnimations().filter(a=>a.playState==='running').length);
  expect(spinning).toBe(0); release();
  await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','success');
  await expect(page.locator('[data-auth-check]')).toHaveCSS('filter','none');
  await expect(page).toHaveURL(/\/conta\?section=security$/);
});

test('password reset confirms only after backend success, then returns to sign-in',async({page})=>{
  let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
  await page.route('**/api/auth/reset-password',async route=>{await pending;await route.fulfill({json:{status:true}});});
  await page.goto('/portal/redefinir?token=ui-fixture');
  await page.getByLabel('Nova senha',{exact:true}).fill('Updated-Password-123!');
  await page.getByLabel('Confirmar nova senha',{exact:true}).fill('Updated-Password-123!');
  const before=await geometry(page);
  await page.getByRole('button',{name:'Salvar nova senha'}).click();
  await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','loading');
  expect(await geometry(page)).toEqual(before); release();
  await expect(page.locator('[data-auth-confirmation]')).toHaveAttribute('data-auth-confirmation','success');
  expect(await geometry(page)).toEqual(before);
  await expect(page).toHaveURL('/portal/acesso');
});

for (const width of [320, 390, 1440]) {
  test(`password visibility stays centered inside the input at ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:900});
    for (const [path,inputName] of [['/portal/acesso','Senha'],['/portal/redefinir?token=alignment-fixture','Nova senha']]) {
      await page.goto(path);
      const input=page.getByLabel(inputName,{exact:true});
      const button=page.getByRole('button',{name:'Mostrar senha',exact:true});
      const field=await input.boundingBox(), toggle=await button.boundingBox();
      expect(Math.abs(toggle!.y+toggle!.height/2-field!.y-field!.height/2)).toBeLessThan(1);
      expect(toggle!.x).toBeGreaterThan(field!.x);
      expect(toggle!.x+toggle!.width).toBeLessThanOrEqual(field!.x+field!.width);
      expect(toggle!.width).toBeGreaterThanOrEqual(44);
      await input.fill('Visible-password-123!');
      await button.click();
      await expect(input).toHaveAttribute('type','text');
      await page.getByRole('button',{name:'Ocultar senha',exact:true}).click();
      await expect(input).toHaveAttribute('type','password');
      await page.screenshot({path:`/tmp/password-toggle-${width}-${inputName==='Senha'?'login':'reset'}.png`});
    }
  });
}
