// Builds concept.html: the phone redesign, drawn over real WebGL plates
// rendered from the live engine (plates/*.jpg). Run: node design/mobile/build.mjs
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
const KPI = [
  ['leaseVolume', '104.370.400', '€'],
  ['developedArea', '235.300', 'm²'],
  ['projectVolume', '168.400.000', '€'],
];

const chevron = `<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>`;
const langPill = `<button class="lang">DE<svg viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg></button>`;

const rows = (compact = false) => `
  <nav class="rows${compact ? ' rows--compact' : ''}">
    ${DIV.map(([id, ic]) => `
      <a class="row">
        <span class="row__glyph">${icon(ic)}</span>
        <span class="row__name">${de.divisions[id].label.replace('\n', '<br>')}</span>
        ${chevron}
      </a>`).join('')}
  </nav>`;

const heading = de.kpiHeading.replace('7', '<b class="sig">7</b>');

const frames = [
  {
    id: 'f1', w: 393, h: 852, plate: 'intro_393', cap: 'Intro · iPhone 16 · 393×852',
    note: 'Mark exactly centred on the visible screen. A quiet, localised cue under it replaces guessing.',
    body: `
      <div class="intro">
        <span class="ping"></span><span class="ping ping--2"></span>
        <img class="intro__mark" src="lockup.png" alt="">
        <p class="intro__cue"><i></i>Zum Betreten tippen<i></i></p>
      </div>`,
  },
  {
    id: 'f2', w: 393, h: 852, plate: 'over_393', cap: 'Overview · iPhone 16 · 393×852',
    note: 'Globe ×2.8 larger (diameter 300 px, was 108). All four divisions above the fold as full-width rows; figures peek below to invite the scroll.',
    body: `
      <header class="bar"><img class="bar__mark" src="lockup.png" alt="">${langPill}</header>
      <div class="over" style="--top:462px">${rows()}</div>
      <div class="peek" style="top:790px"><span>${heading}</span></div>`,
  },
  {
    id: 'f3', w: 393, h: 852, plate: 'scroll_393', cap: 'Scrolled · figures, partner, legal',
    note: 'Figures stacked: 34 px numerals (were 13 px), one-line captions. Legal links 12 px at 64 % (were 8.5 px at 16 %).',
    body: `
      <header class="bar bar--sticky"><img class="bar__crown" src="crown.png" alt="">${langPill}</header>
      <div class="dim"></div>
      <section class="kpis">
        <p class="eyebrow eyebrow--c">${heading}</p>
        ${KPI.map(([id, n, u]) => `
          <div class="kpi"><p class="kpi__label">${de.kpis[id].replace('\n', ' ')}</p>
          <p class="kpi__val">${n}<span>${u}</span></p></div>`).join('<i class="kpi__rule"></i>')}
      </section>
      <a class="partner"><span class="eyebrow">${de.partnerLabel}</span>
        <span class="seyband"><span class="seyband__word"><b>SEYBAND</b>GRUPPE</span><i class="r1"></i><i class="r2"></i></span></a>
      <footer class="foot"><span class="foot__co">${de.company}</span>
        <span class="foot__links"><a>${de.imprint}</a><i></i><a>${de.privacy}</a></span></footer>`,
  },
  {
    id: 'f4', w: 393, h: 852, plate: 'detail_393', cap: 'Division · iPhone 16',
    note: 'Text never touches the globe: it owns the sky, the globe is the horizon. Explicit back button; a frosted dock switches divisions (swipe also works).',
    body: detail(3, 393),
  },
  {
    id: 'f5', w: 320, h: 568, plate: 'over_320', cap: 'Overview · iPhone SE · 320×568',
    note: 'Smallest phone in use. Globe 168 px (was 36 px). Everything still above the fold.',
    body: `
      <header class="bar bar--sm"><img class="bar__mark" src="lockup.png" alt="">${langPill}</header>
      <div class="over" style="--top:298px">${rows(true)}</div>`,
  },
  {
    id: 'f6', w: 320, h: 568, plate: 'detail_320', cap: 'Division · iPhone SE',
    note: 'Same structure, type steps down one size. Long copy scrolls inside its column, never under the dock.',
    body: detail(3, 320),
  },
  {
    id: 'f7', w: 393, h: 659, plate: 'over_393s', cap: 'Overview · real Safari height · 393×659',
    note: 'What an iPhone 16 actually shows with the address bar. The layout solves for the visible height, not the device height.',
    body: `
      <header class="bar"><img class="bar__mark" src="lockup.png" alt="">${langPill}</header>
      <div class="over" style="--top:374px">${rows(true)}</div>`,
  },
  {
    id: 'f8', w: 844, h: 390, plate: 'land_844', cap: 'Landscape · 844×390',
    note: 'Two panes instead of one crushed column: globe left, navigation right. Nothing overlaps (today four blocks collide here).',
    body: `
      <div class="land">
        <header class="land__bar"><img class="bar__mark" src="lockup.png" alt="">${langPill}</header>
        ${rows(true)}
      </div>`,
  },
];

function detail(n, w) {
  const id = DIV[n - 1][0];
  const t = de.divisions[id];
  const sm = w < 360;
  return `
    <header class="bar bar--detail">
      <button class="back"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Übersicht</button>
      <img class="bar__crown" src="crown.png" alt="">${langPill}
    </header>
    <article class="det${sm ? ' det--sm' : ''}">
      <p class="eyebrow eyebrow--accent">${de.eyebrow} <span>0${n} / 04</span></p>
      <h1>${t.label.replace('\n', '<br>')}</h1>
      <p class="det__body">${t.body}</p>
    </article>
    <nav class="dock${sm ? ' dock--sm' : ''}">
      ${DIV.map(([, ic], i) => `<button class="dock__btn${i === n - 1 ? ' is-on' : ''}">${icon(ic)}</button>`).join('')}
    </nav>`;
}

const css = readFileSync(join(here, 'concept.css'), 'utf8');
const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hamlet — Phone concept</title><style>${css}</style></head><body>
<header class="board__head"><h1>Hamlet Holding Group — Phone redesign</h1>
<p>Concept frames drawn over plates rendered by the live WebGL engine. German copy, real figures.</p></header>
<main class="board">
${frames.map((f) => `
  <figure class="fig">
    <div class="frame" id="${f.id}" style="width:${f.w}px;height:${f.h}px;background-image:url(plates/${f.plate}.jpg)">${f.body}</div>
    <figcaption><b>${f.cap}</b><span>${f.note}</span></figcaption>
  </figure>`).join('')}
</main></body></html>`;
writeFileSync(join(here, 'concept.html'), html);
console.log('wrote concept.html');
