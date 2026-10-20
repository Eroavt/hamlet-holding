import { chromium } from 'playwright';
const [, , outDir = 'shots', url = 'http://127.0.0.1:5173/', only] = process.argv;
const VPS = [
  ['se1', 320, 568], ['se3', 375, 667], ['mini', 375, 812], ['i14', 390, 844],
  ['i16', 393, 852], ['i16safari', 393, 659], ['i17pro', 402, 874], ['pixel8', 412, 915],
  ['a14', 360, 780], ['fold', 344, 882], ['promax', 440, 956], ['land', 844, 390], ['landmax', 932, 430],
];
const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});
for (const [name, w, h] of VPS) {
  if (only && !only.split(',').includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__hhg, null, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${outDir}/${name}_1_universe.png` });
  await page.locator('#logo').click({ force: true }).catch((e) => errs.push('logo ' + e));
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${outDir}/${name}_2_select.png` });
  const info = await page.evaluate(() => ({
    layout: document.documentElement.dataset.layout,
    ring: getComputedStyle(document.documentElement).getPropertyValue('--dist-scale'),
    tier: window.__hhg?.stats().tier,
    hs: [...document.querySelectorAll('.hs')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }),
  }));
  await page.locator('.hs').first().click({ force: true }).catch((e) => errs.push('hs ' + e));
  await page.waitForTimeout(4500);
  await page.screenshot({ path: `${outDir}/${name}_3_detail.png` });
  console.log(name, `${w}x${h}`, JSON.stringify(info), errs.length ? 'ERR ' + errs.join(' | ') : '');
  await ctx.close();
}
await browser.close();
