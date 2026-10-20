// Phone sweep: every format x every language x overview / division, with a
// geometric collision check. Exits non-zero on any violation.
//
//   node scripts/phone/sweep.mjs [outDir] [only=fmt,fmt] [langs=de,en,ru]
//
// Needs the dev server running and the `playwright` package available (it is
// not a project dependency — it drives the system Chrome).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const [, , out = '.captures/sweep', onlyArg, langArg = 'de,en,ru'] = process.argv;
mkdirSync(out, { recursive: true });

const FORMATS = [
  ['se1', 320, 568], ['se3', 375, 667], ['mini', 375, 812], ['a14', 360, 780],
  ['i14', 390, 844], ['i16', 393, 852], ['i16safari', 393, 659], ['i17pro', 402, 874],
  ['pixel8', 412, 915], ['fold', 344, 882], ['promax', 440, 956], ['promaxSafari', 440, 760],
  ['land', 844, 390], ['landmax', 932, 430], ['landse', 667, 375],
];
const only = onlyArg && onlyArg !== 'all' ? onlyArg.split(',') : null;
const langs = langArg.split(',');

/* Runs in the page. Returns a list of human-readable violations. */
function audit(stage) {
  const v = [];
  const W = innerWidth, H = innerHeight;
  const st = getComputedStyle(document.documentElement);
  const globe = {
    x: parseFloat(st.getPropertyValue('--stage-cx')),
    y: parseFloat(st.getPropertyValue('--stage-cy')),
    r: parseFloat(st.getPropertyValue('--globe-radius')),
  };
  const box = (el) => {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height };
  };
  const visible = (el) => {
    if (!el || el.closest('[hidden]')) return false;
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
      n = n.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  // Ink box of a text element: the union of its text line boxes, so padding
  // and hit-area pseudo-elements do not count as collisions.
  const ink = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rs = [...range.getClientRects()].filter((r) => r.width > 0);
    if (!rs.length) return box(el);
    return {
      l: Math.min(...rs.map((r) => r.left)), t: Math.min(...rs.map((r) => r.top)),
      r: Math.max(...rs.map((r) => r.right)), b: Math.max(...rs.map((r) => r.bottom)),
    };
  };
  const overlap = (a, b, tol = 1) => a.l < b.r - tol && b.l < a.r - tol && a.t < b.b - tol && b.t < a.b - tol;
  const hitsCircle = (a, c, pad) => {
    const nx = Math.max(a.l, Math.min(c.x, a.r));
    const ny = Math.max(a.t, Math.min(c.y, a.b));
    return Math.hypot(nx - c.x, ny - c.y) < c.r + pad;
  };
  const onScreenX = (name, a) => {
    if (a.l < 4 || a.r > W - 4) v.push(`${name} leaves the screen horizontally (${a.l.toFixed(0)}..${a.r.toFixed(0)} of ${W})`);
  };

  const items = [];
  const add = (name, el, useInk = true) => {
    if (visible(el)) items.push({ name, a: useInk ? ink(el) : box(el), el });
  };

  if (stage === 'overview') {
    const logo = document.querySelector('#logo .logo__art');
    if (visible(logo)) items.push({ name: 'mark', a: box(logo) });
    document.querySelectorAll('.lang__btn').forEach((b, i) => add(`lang${i}`, b));
    document.querySelectorAll('.hs').forEach((h, i) => {
      add(`label${i}`, h.querySelector('.hs__name'));
      add(`icon${i}`, h.querySelector('.hs__glyph'), false);
    });
    add('figuresHeading', document.querySelector('.kh__t'));
    document.querySelectorAll('.kpi').forEach((k, i) => {
      add(`caption${i}`, k.querySelector('.kpi__label'));
      add(`figure${i}`, k.querySelector('.kpi__value'), false);
    });
    add('partner', document.querySelector('#footer-partner-label'));
    add('seyband', document.querySelector('.seyband'), false);
    add('company', document.querySelector('#footer-legal'));
    document.querySelectorAll('#footer-links a').forEach((a, i) => add(`legal${i}`, a));

    for (const it of items) {
      onScreenX(it.name, it.a);
      if (it.name.startsWith('label') || it.name.startsWith('icon') || it.name === 'mark' || it.name.startsWith('lang')) {
        if (hitsCircle(it.a, globe, it.name.startsWith('icon') ? 2 : 4)) v.push(`${it.name} touches the globe`);
      }
    }
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++)
        if (overlap(items[i].a, items[j].a)) v.push(`${items[i].name} overlaps ${items[j].name}`);

    // The four divisions must all be reachable without scrolling.
    document.querySelectorAll('.hs__glyph').forEach((g, i) => {
      const a = box(g);
      if (a.b > H) v.push(`icon${i} is below the fold (${a.b.toFixed(0)} > ${H})`);
    });
    // Scroll track has to reach the last line of the page.
    const sc = document.getElementById('scroller');
    const last = document.querySelector('#footer-links');
    if (sc && last) {
      const bottomInPage = last.getBoundingClientRect().bottom + sc.scrollTop;
      if (bottomInPage > sc.scrollHeight + 1) v.push(`page is taller than its scroll track (${bottomInPage.toFixed(0)} > ${sc.scrollHeight})`);
    }
  }

  if (stage === 'detail') {
    add('back', document.querySelector('#back'), false);
    const logo = document.querySelector('#logo .logo__crown');
    if (visible(logo)) items.push({ name: 'crown', a: box(logo) });
    document.querySelectorAll('.lang__btn').forEach((b, i) => add(`lang${i}`, b));
    add('eyebrow', document.querySelector('#detail-eyebrow'));
    add('title', document.querySelector('#detail-title'));
    const body = document.querySelector('#detail-body');
    if (visible(body)) items.push({ name: 'body', a: box(body) });
    const dock = document.querySelector('#hotspots.is-rail');
    if (visible(dock)) items.push({ name: 'dock', a: box(dock) });

    for (const it of items) {
      onScreenX(it.name, it.a);
      if (['eyebrow', 'title', 'body', 'back', 'crown'].includes(it.name) || it.name.startsWith('lang')) {
        if (hitsCircle(it.a, globe, 6)) v.push(`${it.name} sits on the globe`);
      }
      if (it.a.b > H || it.a.t < 0) v.push(`${it.name} is cut off vertically (${it.a.t.toFixed(0)}..${it.a.b.toFixed(0)} of ${H})`);
    }
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++)
        if (overlap(items[i].a, items[j].a)) v.push(`${items[i].name} overlaps ${items[j].name}`);
    // The horizon must actually be in frame, above the dock.
    if (dock && visible(dock) && globe.y - globe.r > box(dock).t - 40) v.push('globe cap hides behind the dock');
    if (globe.y - globe.r > H) v.push('globe is out of frame');
  }
  return v;
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
});

const jobs = [];
for (const [name, w, h] of FORMATS) {
  if (only && !only.includes(name)) continue;
  for (const lang of langs) jobs.push({ name, w, h, lang });
}

let failures = 0;
async function run({ name, w, h, lang }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript((l) => localStorage.setItem('hhg.lang', l), lang);
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e)));
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForFunction(() => window.__hhg, null, { timeout: 45000 });
  await page.waitForTimeout(2600);
  const tag = `${name}_${lang}`;
  await page.locator('#logo').click({ force: true });
  await page.waitForTimeout(6800);
  await page.screenshot({ path: `${out}/${tag}_overview.png` });
  const ov = await page.evaluate(audit, 'overview');
  await page.evaluate(() => (document.getElementById('scroller').scrollTop = 99999));
  await page.waitForTimeout(450);
  const ovScrolled = await page.evaluate(audit, 'overview');
  await page.screenshot({ path: `${out}/${tag}_bottom.png` });
  await page.evaluate(() => (document.getElementById('scroller').scrollTop = 0));
  await page.waitForTimeout(300);
  await page.locator('.hs').nth(2).click({ force: true });
  await page.waitForTimeout(3600);
  await page.screenshot({ path: `${out}/${tag}_detail.png` });
  const dt = await page.evaluate(audit, 'detail');

  // Only scrolled-state violations that are not about the fold count there.
  const scrolledOnly = ovScrolled.filter((x) => !x.includes('below the fold') && !ov.includes(x));
  const all = [...ov.map((x) => `overview: ${x}`), ...scrolledOnly.map((x) => `scrolled: ${x}`), ...dt.map((x) => `detail: ${x}`), ...errs.map((x) => `error: ${x}`)];
  if (all.length) failures += all.length;
  console.log(`${all.length ? 'FAIL' : ' ok '}  ${tag.padEnd(18)} ${w}x${h}${all.length ? '\n      ' + all.join('\n      ') : ''}`);
  await ctx.close();
}

// Three at a time: enough to be quick, few enough that WebGL keeps its frame rate.
const queue = [...jobs];
await Promise.all([0, 1, 2].map(async () => { while (queue.length) await run(queue.shift()); }));
await browser.close();
console.log(failures ? `\n${failures} violation(s)` : '\nall clear');
process.exit(failures ? 1 : 0);
