import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Uses the running server as configured: no clearance cookies or API mocks.
const phase = process.argv[2] || 'before';
const directory = `docs/responsive-audit/${phase}`;
await mkdir(directory, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const widths = [320, 360, 375, 390, 414, 430, 480, 600, 767, 768, 820, 1024, 1099, 1100, 1199, 1200, 1280, 1366, 1440, 1536, 1920, 2560, 3440];
const routes = ['/', '/placa-nfc', '/criacao-de-sites', '/landing-pages', '/cardapio-digital', '/portal/acesso', '/portal/redefinir', '/admin-dashboard-su/secure-entry', '/privacidade', '/termos', '/cookies', '/lgpd', '/reembolso', '/conta', '/dashboard', '/portal/seguranca', '/verificar', '/pagina-inexistente'];
const results = [];
try {
  for (const route of routes) {
    await page.setViewportSize({ width: 1440, height: 900 });
    const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);
    await page.locator('[data-presentation]').waitFor({ state: 'detached', timeout: 30000 });
    const destination = new URL(page.url()).pathname;
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
      await page.waitForTimeout(100);
      const geometry = await page.evaluate(() => {
        const visible = element => { const s = getComputedStyle(element); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0 && element.getClientRects().length; };
        const outside = [...document.querySelectorAll('h1,h2,h3,p,button,input,select,textarea,nav,article,form')].filter(visible).flatMap(element => {
          if (element.closest('[aria-hidden="true"], [inert]')) return [];
          const r = element.getBoundingClientRect();
          let parent = element.parentElement;
          while (parent && parent !== document.body) {
            const s = getComputedStyle(parent);
            if (['hidden','clip','auto','scroll'].includes(s.overflowX) && parent.getBoundingClientRect().width < innerWidth) return [];
            parent = parent.parentElement;
          }
          return r.left < -1 || r.right > innerWidth + 1 ? [{ tag: element.tagName, class: String(element.className).slice(0,180), text: element.textContent?.trim().slice(0,70), left: Math.round(r.left), right: Math.round(r.right) }] : [];
        });
        const header = document.querySelector('header');
        const links = header ? [...header.querySelectorAll('a,button')].filter(visible).map(e=>{const r=e.getBoundingClientRect();return {text:e.textContent?.trim()||e.getAttribute('aria-label'),left:r.left,right:r.right,top:r.top,bottom:r.bottom};}) : [];
        return { scrollWidth: document.documentElement.scrollWidth, outside, headerControls: links };
      });
      results.push({ route, destination, status: response?.status(), width, ...geometry });
      if ([320, 768, 1440].includes(width) && !['/conta','/dashboard','/portal/seguranca'].includes(route)) await page.screenshot({ path: `${directory}/${route === '/' ? 'home' : route.slice(1).replaceAll('/','-')}-${width}.png`, fullPage: route !== '/' });
    }
    console.log(route, destination, 'overflow:', results.filter(r=>r.route===route && (r.scrollWidth>r.width || r.outside.length)).map(r=>`${r.width}:${r.outside.map(e=>e.class||e.tag).join(',')}`).join(' '));
    await writeFile(`${directory}/results.json`, JSON.stringify({ widths, results, errors }, null, 2));
  }
} finally { await browser.close(); }
if (errors.length || results.some(result => result.scrollWidth > result.width || result.outside.length)) process.exitCode = 1;
