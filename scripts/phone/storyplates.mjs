import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
// name, R, cy, aim: null | [divIndex] | [from, to, frac], collapse progress (null = entered)
const STEPS = [
  ['s1', 102, 337, null, null],
  ['s2', 172, 560, [2], null],
  ['s3', 296, 850, [2], null],
  ['s4', 380, 1010, [2], null],
  ['s5', 380, 1010, [2, 3, 0.42], null],
  ['i2', 102, 337, null, 0.42],
  ['i3', 102, 337, null, 0.8],
];
const W = 393, H = 852, cx = 196.5;
for (const [name, R, cy, aim, collapse] of STEPS) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem('hhg.lang', 'de'));
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.__hhg, null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  if (collapse === null) { await page.locator('#logo').click({ force: true }); await page.waitForTimeout(6000); }
  else { await page.waitForFunction(() => window.__hhg.app.world.matterReady, null, { timeout: 30000 }); }
  const place = ([R, cy, cx]) => {
    const app = window.__hhg.app, root = app.world.root;
    const st = getComputedStyle(document.documentElement);
    let curR = parseFloat(st.getPropertyValue('--globe-radius')), curY = parseFloat(st.getPropertyValue('--stage-cy')), curX = parseFloat(st.getPropertyValue('--stage-cx'));
    const base = curR / root.scale.x, s = R / base;
    root.scale.set(s, s, s); app.world.buildings.scale = s;
    root.position.y -= (cy - curY) / base; root.position.x += (cx - curX) / base;
  };
  if (collapse !== null) {
    // Size the globe in its finished state, then wind the collapse back.
    await page.evaluate(() => window.__hhg.set(1)); await page.waitForTimeout(300);
    for (let i = 0; i < 3; i++) { await page.evaluate(place, [R, cy, cx]); await page.waitForTimeout(300); }
    await page.evaluate((p) => window.__hhg.set(p), collapse); await page.waitForTimeout(700);
  } else {
    if (aim) {
      await page.evaluate((i) => { const a = window.__hhg.app; a.world.aimAt(a.hotspots.tiles[i].dir); }, aim[0]);
      await page.waitForTimeout(1800);
      if (aim.length === 3) {
        const a0 = await page.evaluate(() => window.__hhg.app.world.aim);
        await page.evaluate((i) => { const a = window.__hhg.app; a.world.aimAt(a.hotspots.tiles[i].dir); }, aim[1]);
        await page.waitForTimeout(1800);
        await page.evaluate(([a0, f]) => { const w = window.__hhg.app.world; w.setAim(a0 + (w.aim - a0) * f); }, [a0, aim[2]]);
      }
    }
    for (let i = 0; i < 4; i++) { await page.evaluate(place, [R, cy, cx]); await page.waitForTimeout(350); }
  }
  // node positions (division order) straight from the engine's own projection
  const nodes = await page.evaluate(() => [...document.querySelectorAll('#nodes .node')].map((n) => [+n.getAttribute('cx'), +n.getAttribute('cy')]));
  await page.addStyleTag({ content: '#ui,#nodes,#logo,#boot,#cursor{display:none!important}' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `plates/${name}.jpg`, type: 'jpeg', quality: 90 });
  console.log(name, JSON.stringify(nodes));
  await ctx.close();
}
await browser.close();
