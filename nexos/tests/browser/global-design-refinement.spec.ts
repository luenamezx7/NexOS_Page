import { expect, test } from '@playwright/test';

const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560];
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('nexos-cookie-consent-v1', JSON.stringify({ necessary: true, functional: false, analytics: false, marketing: false, updatedAt: new Date().toISOString() })));
});

for (const width of widths) {
  test(`complete composition remains usable at ${width}px`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0);
    await expect(page.locator('main')).toHaveAttribute('data-motion-detail', 'reduced');
    await expect(page.locator('#comparacao')).toHaveCount(1);
    await expect(page.locator('video[src*="gloved-hand"]')).toHaveCount(0);
    const shape = await page.locator('[data-presence-shape]').evaluate(el => {
      const m = new DOMMatrix(getComputedStyle(el).transform); const r=el.getBoundingClientRect();
      return { x:m.a, y:m.d, left:r.left, right:r.right };
    });
    expect(shape.y).toBeGreaterThanOrEqual(1.25); expect(shape.y).toBeLessThanOrEqual(1.8);
    expect(shape.x).toBeLessThan(1); expect(shape.left).toBeGreaterThanOrEqual(-2); expect(shape.right).toBeLessThanOrEqual(width+2);
    for (const id of ['hero','gestao','easychat','services','mini-sites','showcase','comparacao','delivery-process','mascot-solutions','testimonials','faq','cta-final','brand-closing']) {
      const section=page.locator('#'+id); await section.scrollIntoViewIfNeeded();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), id).toBe(true);
      if ([320,390,768,1440,2560].includes(width) && ['hero','gestao','easychat','mini-sites','comparacao','delivery-process','cta-final'].includes(id)) await section.screenshot({path:info.outputPath(`${id}-${width}.png`)});
    }
    for (const label of ['Clientes','Vendas','Financeiro']) {
      const button=page.locator('[data-management-preview]').getByRole('button',{name:label,exact:true});
      await button.click(); await expect(button).toHaveAttribute('aria-pressed','true');
      await expect(page.locator('#management-preview-panel')).toHaveAccessibleName(label);
    }
    await page.locator('#faq summary').nth(1).click();
    await expect(page.locator('#faq details').nth(1)).toHaveAttribute('open','');
    await expect(page.locator('#faq details').first()).not.toHaveAttribute('open','');
    await page.locator('#comparacao').scrollIntoViewIfNeeded();
    await expect(page.locator('#comparacao')).toContainText('Em desenvolvimento', {ignoreCase:true});
    const cta=page.locator('#comparacao [data-cta-section]');
    expect(new URL((await cta.getAttribute('href'))!).hostname).toBe('wa.me');
    await page.locator('#mini-sites').evaluate(el=>scrollTo({top:el.getBoundingClientRect().top+scrollY-95,behavior:'instant'}));
    await expect(page.locator('header[data-header-state]')).toHaveAttribute('data-nav-surface','dark');
    expect(errors).toEqual([]);
  });
}

for(const width of [390,1440]) {
  test(`motion, touch and keyboard interactions at ${width}px`, async ({page})=>{
    test.setTimeout(60000);
    await page.setViewportSize({width,height:900}); await page.goto('/');
    await expect(page.locator('dialog[data-presentation]')).toHaveCount(0,{timeout:20000});
    const stage=page.locator('[data-mini-site-mockups]'); await expect(stage).toHaveAttribute('data-fan-ready','true');
    await page.locator('#mini-sites').scrollIntoViewIfNeeded();
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect(stage).not.toHaveAttribute('data-fan-ready','true');
    await expect(page.locator('main')).toHaveAttribute('data-motion-detail','reduced');
    await page.emulateMedia({reducedMotion:'no-preference'}); await expect(stage).toHaveAttribute('data-fan-ready','true');
    const plates=page.locator('[data-plate-option] button'); await expect(plates).toHaveCount(1); await expect(page.locator('[data-plate-option]')).toHaveAttribute('data-plate-option','instagram'); await plates.first().scrollIntoViewIfNeeded(); const plateBox=await plates.first().boundingBox(); const gridBox=await page.locator('[data-plate-grid]').boundingBox(); expect(Math.abs(plateBox!.x + plateBox!.width/2 - (gridBox!.x + gridBox!.width/2))).toBeLessThan(2);
    await plates.first().focus(); await page.keyboard.press('Enter');
    const dialog=page.locator('dialog[aria-labelledby="plate-dialog-title"]'); await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape'); await expect(dialog).not.toBeVisible(); await expect(plates.first()).toBeFocused();
    await page.locator('#mascot-solutions').scrollIntoViewIfNeeded(); await page.getByRole('button',{name:'Próximo suporte',exact:true}).click();
    await expect(page.locator('[data-tilted-grid]')).toHaveAttribute('data-running','false');
    await page.getByRole('button',{name:'Retomar animação',exact:true}).click(); await expect(page.locator('[data-tilted-grid]')).toHaveAttribute('data-running','true');
    for(const id of ['comparacao','services','easychat','gestao','hero']) {await page.locator('#'+id).evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(150);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  });
}

test('essential content is readable without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false,reducedMotion:'reduce'});const page=await context.newPage();await page.goto('/');
 await expect(page.locator('[data-avatar-word]')).toBeVisible();await expect(page.locator('#management-preview-panel')).toContainText('Cada cliente');await expect(page.locator('#comparacao h2')).toContainText('sem e com a EZWAY');await context.close();
});


test('dark glass menu has no solid title patch and chat messages reveal on entry', async ({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 await expect(page.locator('dialog[data-presentation]')).toHaveCount(0,{timeout:20000});
 await page.getByRole('button',{name:'Abrir menu',exact:true}).click();
 const heading=page.locator('#mobile-menu-title').locator('..');
 await expect(heading).toHaveCSS('background-color','rgba(0, 0, 0, 0)');
 await expect(heading).toBeVisible();
 await page.getByRole('button',{name:'Fechar menu',exact:true}).click();
 const phone=page.locator('#easychat [class*="phonePreview"]');
 await phone.scrollIntoViewIfNeeded();
 const messages=page.locator('#easychat [data-message-visible]');
 await expect(messages.first()).toHaveAttribute('data-message-visible','true');
 await expect(page.locator('[data-typing="true"]')).toHaveCount(1);
 await expect(messages.nth(3)).toHaveAttribute('data-message-visible','true',{timeout:7000});
 await expect(page.locator('[data-typing="true"]')).toHaveCount(0);
 await page.locator('#gestao').scrollIntoViewIfNeeded();
 await expect(messages.first()).toHaveAttribute('data-message-visible','false');
 await phone.scrollIntoViewIfNeeded();
 await expect(messages.nth(3)).toHaveAttribute('data-message-visible','true',{timeout:7000});
});

test('gradual blur follows the viewport across sections and keeps touch targets usable',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();
 await page.addInitScript(()=>localStorage.setItem('nexos-cookie-consent-v1',JSON.stringify({necessary:true,functional:false,analytics:false,marketing:false,updatedAt:new Date().toISOString()})));
 await page.goto('/');await expect(page.locator('dialog[data-presentation]')).toHaveCount(0);
 const blur=page.locator('.landing-edge-blur');await expect(blur).toHaveCSS('position','fixed');await expect(blur).toHaveCSS('pointer-events','none');await expect(blur.locator('[data-gradual-blur-layer]')).toHaveCount(3);
 for(const id of ['gestao','easychat','showcase','comparacao','cta-final','brand-closing']){await page.locator('#'+id).scrollIntoViewIfNeeded();const box=await blur.boundingBox();expect(Math.abs(box!.y+box!.height-844)).toBeLessThan(1);}
 const cta=page.locator('#cta-final [data-cta-section]');await cta.evaluate(el=>{el.scrollIntoView({block:'end',behavior:'instant'});el.addEventListener('click',event=>{event.preventDefault();el.setAttribute('data-touch-received','true')},{once:true})});const box=await cta.boundingBox();await page.touchscreen.tap(box!.x+box!.width/2,box!.y+box!.height/2);await expect(cta).toHaveAttribute('data-touch-received','true');await context.close();
});
