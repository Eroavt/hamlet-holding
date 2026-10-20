// Filmstrip of the phone transitions in slow motion: descent, swipe, return.
// node scripts/phone/film.mjs <outDir> [w] [h] [lang]
import { chromium } from 'playwright';
const [, , out = '.captures/film', w = '393', h = '852', lang = 'de'] = process.argv;
const SLOW = 0.2;
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await ctx.addInitScript((l) => localStorage.setItem('hhg.lang', l), lang);
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5173/');
await page.waitForFunction(() => window.__hhg, null, { timeout: 30000 });
await page.waitForTimeout(2600);
await page.locator('#logo').click({ force: true });
await page.waitForTimeout(6800);

async function film(name, act, ms, frames) {
  await page.evaluate((s) => window.__hhg.gsap.globalTimeline.timeScale(s), SLOW);
  const t0 = Date.now();
  await act();
  for (let i = 0; i < frames; i++) {
    const target = t0 + ((i * ms) / (frames - 1)) / SLOW;
    const wait = target - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}/${name}_${String(i).padStart(2, '0')}.png` });
  }
  await page.evaluate(() => window.__hhg.gsap.globalTimeline.timeScale(1));
  await page.waitForTimeout(1500);
}

await film('a_descent', () => page.locator('.hs').nth(2).click({ force: true }), 1900, 10);
await film('b_swipe', async () => {
  const y = +h * 0.45;
  await page.evaluate(([x, y]) => {
    const ev = (type, cx) => window.dispatchEvent(new PointerEvent(type, { pointerId: 7, pointerType: 'touch', clientX: cx, clientY: y, bubbles: true }));
    document.getElementById('scroller').dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
    let cx = x;
    const step = () => { cx -= 18; ev('pointermove', cx); if (cx > x - 200) requestAnimationFrame(step); else ev('pointerup', cx); };
    requestAnimationFrame(step);
  }, [+w * 0.8, y]);
}, 1300, 6);
await film('c_return', () => page.locator('#back').click({ force: true }), 1700, 8);
await browser.close();
console.log('filmed');
