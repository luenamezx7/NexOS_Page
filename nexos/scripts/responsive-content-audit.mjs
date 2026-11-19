import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const dir = 'docs/responsive-audit/content';
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({hasTouch:true});
const results = [];
try {
  await page.goto('http://localhost:3000/portal/acesso',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:'Recusar',exact:true}).click();
  for(const locale of ['pt','en','es']) {
    await page.evaluate(l=>localStorage.setItem('easyway-language',l),locale);
    await page.goto('http://localhost:3000/criacao-de-sites',{waitUntil:'domcontentloaded'});
    for(const width of [320,360,375,390,414,430,480,600,767,768,820,1024,1099,1100,1199,1200,1280,1366,1440,1536,1920,2560,3440]) {
      await page.setViewportSize({width,height:900});
      const nav = page.locator('.page-header-nav');
      assert(await nav.isVisible(),`Navigation hidden at ${width} ${locale}`);
      const bounds = await nav.locator('a').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};}));
      assert(bounds.every(b=>b.left>=0&&b.right<=width),`Navigation overflow at ${width} ${locale}`);
      results.push({check:'internal-navigation',locale,width,passed:true});
    }
  }
  await page.evaluate(()=>localStorage.setItem('easyway-language','pt'));
  for(const route of ['/','/placa-nfc','/criacao-de-sites','/landing-pages','/cardapio-digital']) {
    await page.goto(`http://localhost:3000${route}`,{waitUntil:'domcontentloaded'});
    await page.locator('[data-presentation]').waitFor({state:'detached',timeout:30000});
    for(const viewport of [{width:320,height:568},{width:600,height:900},{width:768,height:1024},{width:1024,height:600},{width:1440,height:900},{width:2560,height:1080},{width:844,height:390}]) {
      await page.setViewportSize(viewport);
      // Scroll through real content so reveal/pinning behavior is exercised.
      await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
      for(let y=0;y<await page.evaluate(()=>document.documentElement.scrollHeight);y+=Math.max(300,viewport.height-140)) {
        await page.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);
        await page.waitForTimeout(40);
      }
      const overflow = await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert(!overflow,`${route} ${viewport.width}: document overflow after scrolling`);
      const clipped = await page.locator('h1,h2,h3,form,input,textarea').evaluateAll(es=>es.filter(e=>{
        const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity)>0&&e.getClientRects().length&&!e.closest('[aria-hidden="true"], [inert]');
      }).flatMap(e=>{
        const s=getComputedStyle(e);
        return e.scrollWidth>e.clientWidth+2 && !['auto','scroll'].includes(s.overflowX)?[{tag:e.tagName,class:String(e.className),text:e.textContent?.slice(0,80),width:e.clientWidth,scroll:e.scrollWidth}]:[];
      }));
      results.push({check:'scrolled-content',route,...viewport,overflow,clipped});
      if([320,768,1440].includes(viewport.width)) {
        await page.screenshot({path:`${dir}/${route==='/'?'home':route.slice(1)}-${viewport.width}-scrolled.png`,fullPage:true});
      }
    }
    if(route==='/') {
      await page.setViewportSize({width:320,height:568});
      const trigger=page.locator('[data-management-simulate]');
      await trigger.click();
      const dialog=page.locator('dialog[open]');
      await dialog.waitFor();
      for(const control of await dialog.locator('button,input,select').all()) { await control.scrollIntoViewIfNeeded(); assert(await control.isVisible()); }
      await page.screenshot({path:`${dir}/management-dialog-320.png`});
      await page.keyboard.press('Escape');
      results.push({check:'management-dialog',passed:await dialog.count()===0 || !(await dialog.isVisible())});
    }
  }
} finally { await writeFile(`${dir}/results.json`,JSON.stringify(results,null,2));await browser.close(); }
console.log(JSON.stringify({checks:results.length,clipped:results.filter(r=>r.clipped?.length)}));
