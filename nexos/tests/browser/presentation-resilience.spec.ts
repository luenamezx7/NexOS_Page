import { expect, test } from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.addInitScript(()=>localStorage.setItem('nexos-cookie-consent-v1',JSON.stringify({necessary:true,functional:false,analytics:false,marketing:false,updatedAt:new Date().toISOString()})));
});

for(const scenario of ['silent worker','failed worker','worker download failure','no WebGL'] as const){
 test(`${scenario}: the opening remains visibly branded and releases the page`,async({page})=>{
  test.setTimeout(45000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  if(scenario==='silent worker') await page.route('**/presentation-worker.js',route=>route.fulfill({contentType:'application/javascript',body:'self.onmessage = () => {};'}));
  if(scenario==='failed worker') await page.route('**/presentation-worker.js',route=>route.fulfill({contentType:'application/javascript',body:'self.onmessage = () => self.postMessage({type:"failure",message:"simulated unsupported GPU"});'}));
  if(scenario==='worker download failure') await page.route('**/presentation-worker.js',route=>route.abort());
  if(scenario==='no WebGL') await page.addInitScript(()=>{
   Object.defineProperty(HTMLCanvasElement.prototype,'transferControlToOffscreen',{value:undefined});
   const original=HTMLCanvasElement.prototype.getContext;
   HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,...args:Parameters<typeof original>){if(String(args[0]).startsWith('webgl'))return null;return Reflect.apply(original,this,args)} as typeof original;
  });
  const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:6});
  await page.goto('/',{waitUntil:'domcontentloaded'});
  const dialog=page.locator('dialog[data-presentation]');const mascot=dialog.locator('[data-logo-reveal]');const fallback=mascot.locator('[data-logo-fallback]');
  await expect(dialog).toBeVisible();
  await expect(fallback).toBeVisible({timeout:3000});
  await expect(mascot).toHaveAttribute('data-logo-reveal','fallback',{timeout:3500});
  const animated=await fallback.evaluate(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running'));
  expect(animated).toBe(true);
  await expect(dialog).toHaveCount(0,{timeout:13000});
  await expect(page.locator('#hero')).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');expect(errors).toEqual([]);
  await cdp.detach();
 });
}

test('fallback is visible before delayed hydration while the worker is starting',async({page})=>{
 await page.route('**/presentation-worker.js',route=>route.fulfill({contentType:'application/javascript',body:'self.onmessage = () => {};'}));
 await page.route('**/_next/**/*.js*',async route=>{await new Promise(resolve=>setTimeout(resolve,2500));await route.continue()});
 await page.goto('/',{waitUntil:'commit'});
 const dialog=page.locator('dialog[data-presentation]');
 await expect(dialog.locator('[data-logo-fallback]')).toBeVisible({timeout:2000});
 await expect(dialog).toHaveCount(0,{timeout:14000});
});
