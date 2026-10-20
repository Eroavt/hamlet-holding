import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--use-angle=metal','--enable-gpu','--ignore-gpu-blocklist'] });
// name, w, h, radius px, cx, cy, enter?
const PLATES = [
  ['intro_393', 393, 852, 0, 0, 0, false],
  ['o2_393', 393, 852, 102, 196.5, 337, true],
  ['o2_393s', 393, 659, 102, 196.5, 337, true],
  ['o2_320', 320, 568, 84, 160, 272, true],
  ['o2_440', 440, 956, 114, 220, 366, true],
  ['o2_land', 844, 390, 104, 422, 236, true],
  ['over_393', 393, 852, 148, 196.5, 282, true],
  ['over_320', 320, 568, 84, 160, 190, true],
  ['over_393s', 393, 659, 110, 196.5, 236, true],
  ['scroll_393', 393, 852, 150, 196.5, -40, true],
  ['detail_393', 393, 852, 380, 196.5, 1010, true],
  ['detail_320', 320, 568, 300, 160, 720, true],
  ['land_844', 844, 390, 142, 236, 200, true],
  ['detland_844', 844, 390, 230, 236, 400, true],
];
const ONLY = process.argv[2]?.split(',');
for (const [name, w, h, R, cx, cy, enter] of PLATES) {
  if (ONLY && !ONLY.includes(name)) continue;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => localStorage.setItem('hhg.lang', 'de'));
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.__hhg, null, { timeout: 30000 });
  await page.waitForTimeout(2500);
  if (enter) {
    await page.locator('#logo').click({ force: true });
    await page.waitForTimeout(6000);
    for (let i = 0; i < 4; i++) {
      await page.evaluate(([R, cx, cy]) => {
        const app = window.__hhg.app, root = app.world.root, cam = app.camera;
        const st = getComputedStyle(document.documentElement);
        const curR = parseFloat(st.getPropertyValue('--globe-radius'));
        const curY = parseFloat(st.getPropertyValue('--stage-cy'));
        const curX = parseFloat(st.getPropertyValue('--stage-cx'));
        const base = curR / root.scale.x;
        const s = R / base;
        root.scale.set(s, s, s); app.world.buildings.scale = s;
        root.position.y -= (cy - curY) / base;
        root.position.x += (cx - curX) / base;
      }, [R, cx, cy]);
      await page.waitForTimeout(400);
    }
  }
  await page.addStyleTag({ content: '#ui,#nodes,#logo,#boot,#cursor{display:none!important}' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `plates/${name}.jpg`, type: 'jpeg', quality: 90 });
  const got = await page.evaluate(() => { const st = getComputedStyle(document.documentElement); return [st.getPropertyValue('--globe-radius'), st.getPropertyValue('--stage-cx'), st.getPropertyValue('--stage-cy')]; });
  console.log(name, 'want', R, cx, cy, 'got', got.join(' '));
  await ctx.close();
}
await browser.close();
