// v2 — the reference composition (globe centred, divisions framing it), refined.
// Run: node design/mobile/build2.mjs  ->  concept-v2.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const icon = (k) => `<svg viewBox="0 0 48 48" aria-hidden="true">${readFileSync(join(here, `${k}.svgfrag`), 'utf8')}</svg>`;
const de = JSON.parse(readFileSync(join(here, '../../src/content/de.json'), 'utf8'));

const DIV = [
  ['projectDevelopment', 'ICON_BUILDING'],
  ['realEstateInvestment', 'ICON_INVESTMENT'],
  ['transactionManagement', 'ICON_TRANSACTION'],
  ['constructionManagement', 'ICON_CRANE'],
];
// Phone captions are broken by hand: three columns are ~117 px wide, and
// "MIETVERTRAGSVOLUMEN" set unbroken runs out of its column (it does today).
const KPI = [
  ['Realisiertes\nMietvertrags-\nvolumen', '104.370.400', '€'],
  ['Entwickelte\nGrund- und\nNutzfläche', '235.300', 'm²'],
  ['Realisiertes\nProjekt-\nvolumen', '168.400.000', '€'],
];

const vlang = `<nav class="vlang"><a class="on">DE</a><i></i><a>EN</a><i></i><a>RU</a></nav>`;

/**
 * The constellation. Markers sit in the four diagonal corners of the globe's
 * bounding square — the space a circle leaves empty — so the globe can grow
 * without the composition getting any taller. Labels go on the outside of each
 * row (above the upper pair, below the lower pair) so the icons hug the sphere.
 */
function constellation(g) {
  const { W, H, cx, cy, ax, ay, ic, fs, gap } = g;
  const d = Math.hypot(ax, ay);
  const lh = Math.round(fs * 1.34);
  const labelH = lh * 2;
  const pos = [
    [cx - ax, cy - ay, 'up'],
    [cx + ax, cy - ay, 'up'],
    [cx - ax, cy + ay, 'down'],
    [cx + ax, cy + ay, 'down'],
  ];
  // The orbit is masked wherever a label or icon sits, so it reads as a line
  // that passes *behind* the furniture rather than through it.
  const holes = pos.map(([x, y, dir]) => {
    const ly = dir === 'up' ? y - ic / 2 - gap - labelH : y + ic / 2 + gap;
    return `<rect x="${x - 74}" y="${ly - 6}" width="148" height="${labelH + 12}" rx="6"/>
            <rect x="${x - ic / 2 - 7}" y="${y - ic / 2 - 7}" width="${ic + 14}" height="${ic + 14}" rx="14"/>`;
  }).join('');
  return `
  <svg class="orbit" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs><mask id="m${W}${H}"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
    <g mask="url(#m${W}${H})">
      <circle cx="${cx}" cy="${cy}" r="${d}" class="orbit__ring"/>
      <circle cx="${cx}" cy="${cy}" r="${d + 9}" class="orbit__ring orbit__ring--faint"/>
    </g>
  </svg>
  ${pos.map(([x, y, dir], i) => `
    <a class="mk mk--${dir}" style="left:${x}px;top:${y}px;--ic:${ic}px;--fs:${fs}px;--gap:${gap}px">
      <span class="mk__glyph">${icon(DIV[i][1])}</span>
      <span class="mk__label">${de.divisions[DIV[i][0]].label.replace('\n', '<br>')}</span>
    </a>`).join('')}`;
}

function lower(top, sm) {
  // Two deliberate lines: one line with its rules does not fit any phone at a legible size.
  const heading = de.kpiHeading.replace(' in den ', '<br>in den ').replace('7', '<b class="sig">7</b>');
  return `
  <section class="low${sm ? ' low--sm' : ''}" style="top:${top}px">
    <p class="kh"><i></i><span>${heading}</span><i></i></p>
    <dl class="kg">
      ${KPI.map(([l, n, u]) => `<div class="kc"><dt>${l.replace(/\n/g, '<br>')}</dt><span class="kr"></span><dd>${n}<span>${u}</span></dd></div>`).join('')}
    </dl>
    <a class="pt"><span>${de.partnerLabel}</span>
      <span class="seyband"><span class="seyband__word"><b>SEYBAND</b>GRUPPE</span><i class="r1"></i><i class="r2"></i></span></a>
    <footer class="ft"><span class="ft__co">${de.company}</span>
      <span class="ft__links"><a>${de.imprint}</a><i></i><a>${de.privacy}</a></span></footer>
  </section>`;
}

const page = (g) => `
  <img class="lock" src="lockup.png" alt="" style="width:${g.lw}px;top:${g.lt}px">
  ${vlang}
  ${constellation(g)}
  ${lower(g.low, g.W < 360)}`;

function detail(n, sm) {
  const t = de.divisions[DIV[n - 1][0]];
  return `
    <button class="back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Übersicht</button>
    <img class="bar__crown bar__crown--detail" src="crown.png" alt="">
    ${vlang}
    <article class="det det2${sm ? ' det--sm' : ''}">
      <p class="eyebrow eyebrow--accent">${de.eyebrow} <span>0${n} / 04</span></p>
      <h1>${t.label.replace('\n', '<br>')}</h1>
      <p class="det__body">${t.body}</p>
    </article>
    <nav class="dock${sm ? ' dock--sm' : ''}">
      ${DIV.map(([, ic], i) => `<button class="dock__btn${i === n - 1 ? ' is-on' : ''}">${icon(ic)}</button>`).join('')}
    </nav>`;
}

const G393 = { W: 393, H: 852, cx: 196.5, cy: 337, ax: 116, ay: 95, ic: 56, fs: 12.5, gap: 10, lw: 184, lt: 36, low: 540 };
const frames = [
  { id: 'v1', plate: 'o2_393', ...G393, cap: 'Übersicht · iPhone 16 · 393×852 — the full screen, like the reference',
    note: 'Globe 204 px (reference 158). Markers tucked into the globe’s corners, labels outside, a faint orbit ties them together. Figures, partner and legal all on one screen.',
    body: page(G393) },
  { id: 'v2', plate: 'o2_393s', ...G393, H: 659, cap: 'Same page in real Safari · 393×659',
    note: 'With the address bar showing, the whole constellation and the figures are still on the first screen. Partner and legal are one short scroll away — nothing shrinks.',
    body: page({ ...G393, H: 659 }) },
  { id: 'v3', plate: 'o2_320', W: 320, H: 568, cx: 160, cy: 272, cap: 'iPhone SE · 320×568',
    note: 'Smallest phone. Same composition at 52 % globe width — today it collapses to a 36 px dot.',
    body: page({ W: 320, H: 568, cx: 160, cy: 272, ax: 93, ay: 82, ic: 48, fs: 11, gap: 8, lw: 150, lt: 22, low: 448 }) },
  { id: 'v4', plate: 'o2_440', W: 440, H: 956, cap: 'iPhone Pro Max · 440×956',
    note: 'Largest phone. Everything scales from the width; air is distributed, not pooled under the figures.',
    body: page({ W: 440, H: 956, cx: 220, cy: 366, ax: 128, ay: 102, ic: 60, fs: 13, gap: 10, lw: 204, lt: 44, low: 588 }) },
  { id: 'v5', plate: 'detail_393', W: 393, H: 852, cap: 'Geschäftsbereich · iPhone 16',
    note: 'Tap a marker: the globe drops into a horizon, copy owns the sky. Explicit back button; the dock switches divisions.',
    body: detail(3, false) },
  { id: 'v6', plate: 'detail_320', W: 320, H: 568, cap: 'Geschäftsbereich · iPhone SE', note: 'Same structure one type size down.', body: detail(3, true) },
  { id: 'v7', plate: 'o2_land', W: 844, H: 390, cap: 'Landscape · 844×390',
    note: 'The constellation turns sideways: two divisions either side of the globe, labels on the outside. Figures follow on scroll.',
    body: `
      <img class="lock" src="lockup.png" alt="" style="width:112px;top:14px">
      ${vlang.replace('vlang', 'vlang vlang--row')}
      ${[[190, 176, 0], [654, 176, 1], [190, 296, 2], [654, 296, 3]].map(([x, y, i]) => `
        <a class="mk mk--${i % 2 ? 'right' : 'left'}" style="left:${x}px;top:${y}px;--ic:52px;--fs:11.5px;--gap:14px">
          <span class="mk__glyph">${icon(DIV[i][1])}</span>
          <span class="mk__label">${de.divisions[DIV[i][0]].label.replace('\n', '<br>')}</span>
        </a>`).join('')}` },
];

const css = readFileSync(join(here, 'concept.css'), 'utf8') + readFileSync(join(here, 'concept2.css'), 'utf8');
writeFileSync(join(here, 'concept-v2.html'), `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hamlet — Phone concept v2</title><style>${css}</style></head><body>
<header class="board__head"><h1>Hamlet Holding Group — Phone redesign v2</h1>
<p>The reference composition, refined. Globe plates rendered by the live engine; German copy, real figures.</p></header>
<main class="board">
${frames.map((f) => `
  <figure class="fig">
    <div class="frame" id="${f.id}" style="width:${f.W}px;height:${f.H}px;background-image:url(plates/${f.plate}.jpg)">${f.body}</div>
    <figcaption><b>${f.cap}</b><span>${f.note}</span></figcaption>
  </figure>`).join('')}
</main></body></html>`);
console.log('wrote concept-v2.html');
