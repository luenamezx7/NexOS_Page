import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const phase = process.argv[2] || 'before';
const dir = `docs/responsive-audit/${phase}`;
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ hasTouch: true, isMobile: true });
const page = await context.newPage();
const results = [];
const measure = async label => {
  const data = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, scrollWidth: document.documentElement.scrollWidth,
    dialogs: [...document.querySelectorAll('[role="dialog"],dialog[open]')].filter(e=>e.getBoundingClientRect().height).map(e=>{const r=e.getBoundingClientRect();return {label:e.getAttribute('aria-label'),top:r.top,bottom:r.bottom,height:r.height,scrollHeight:e.scrollHeight};}),
    controls: [...document.querySelectorAll('[role="dialog"] button,dialog[open] button')].filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent?.trim()||e.getAttribute('aria-label'),top:r.top,bottom:r.bottom,left:r.left,right:r.right};}) }));
  results.push({label,...data});
  await page.screenshot({path:`${dir}/${label}.png`});
};
try {
  for(const viewport of [{width:320,height:480},{width:844,height:390},{width:667,height:320},{width:320,height:240}]) {
    await page.setViewportSize(viewport);
    await page.goto('http://localhost:3000/portal/acesso', {waitUntil:'domcontentloaded'});
    await page.getByRole('dialog',{name:'Aviso de cookies'}).waitFor();
    await page.waitForTimeout(600);
    await measure(`cookies-${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({width:320,height:568});
  await page.goto('http://localhost:3000/criacao-de-sites');
  await page.waitForTimeout(500);
  results.push({label:'internal-navigation',visible:await page.getByRole('navigation',{name:'Navegação de páginas'}).isVisible()});
  await page.getByRole('button',{name:'Personalizar',exact:true}).click();
  await page.waitForTimeout(600);
  await measure('cookie-preferences-320');
  const preferences = page.getByRole('dialog',{name:'Preferências de cookies'});
  for(const button of await preferences.locator('button').all()) {
    await button.scrollIntoViewIfNeeded();
    results.push({label:'preference-control-reachable',text:await button.getAttribute('aria-label')||await button.textContent(),visible:await button.evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;})});
  }
  await page.keyboard.press('Escape');
  const reject = page.getByRole('button',{name:'Recusar',exact:true});
  if(await reject.isVisible()) await reject.click();
  await page.goto('http://localhost:3000/',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(5000);
  const menu = page.getByRole('button',{name:/abrir menu/i});
  results.push({label:'menu-trigger',count:await menu.count()});
  if(await menu.count()) { await menu.click(); await page.waitForTimeout(400); await measure('mobile-menu-320'); await page.keyboard.press('Escape'); results.push({label:'menu-escape-focus',restored:await menu.evaluate(e=>document.activeElement===e)}); }
  await page.goto('http://localhost:3000/portal/acesso');
  await page.waitForTimeout(800);
  await page.getByLabel('E-mail',{exact:true}).focus().catch(()=>{});
  await page.setViewportSize({width:390,height:360});
  await measure('keyboard-height-390x360');
  await page.setViewportSize({width:640,height:450});
  await page.evaluate(()=>{document.documentElement.style.zoom='2';});
  await measure('css-zoom-200');
} finally { await writeFile(`${dir}/interactions.json`,JSON.stringify(results,null,2));await browser.close(); }
