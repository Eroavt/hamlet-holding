// Quick look at one phone size: intro, overview, scrolled, descent, division.
// node scripts/phone/check.mjs <outDir> <w> <h> [lang]
// Needs the dev server and the `playwright` package (not a project dependency).
import { chromium } from 'playwright';
const [, , out = '.captures', w = '393', h = '852', lang = 'de'] = process.argv;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await ctx.addInitScript((l) => localStorage.setItem('hhg.lang', l), lang);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(() => window.__hhg, null, { timeout: 30000 });
await page.waitForTimeout(3600);
const tag = `${w}x${h}_${lang}`;
await page.screenshot({ path: `${out}/${tag}_1_intro.png` });
await page.locator('#logo').click({ force: true });
await page.waitForTimeout(6500);
await page.screenshot({ path: `${out}/${tag}_2_overview.png` });
await page.evaluate(() => (document.getElementById('scroller').scrollTop = 9999));
await page.waitForTimeout(500);
await page.screenshot({ path: `${out}/${tag}_3_scrolled.png` });
await page.evaluate(() => (document.getElementById('scroller').scrollTop = 0));
await page.waitForTimeout(400);
await page.locator('.hs').nth(2).click({ force: true });
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/${tag}_4_descent.png` });
await page.waitForTimeout(2600);
await page.screenshot({ path: `${out}/${tag}_5_detail.png` });
console.log(tag, errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
await browser.close();
