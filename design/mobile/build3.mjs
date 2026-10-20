// v3 — the whole flow as a storyboard, over real engine frames.
// Run: node design/mobile/build3.mjs  ->  storyboard.html
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const icon = (k) => `<svg viewBox="0 0 48 48" aria-hidden="true">${readFileSync(join(here, `${k}.svgfrag`), 'utf8')}</svg>`;
const L = {
  de: JSON.parse(readFileSync(join(here, '../../src/content/de.json'), 'utf8')),
  ru: JSON.parse(readFileSync(join(here, '../../src/content/ru.json'), 'utf8')),
};
const ICONS = ['ICON_BUILDING', 'ICON_INVESTMENT', 'ICON_TRANSACTION', 'ICON_CRANE'];
const IDS = ['projectDevelopment', 'realEstateInvestment', 'transactionManagement', 'constructionManagement'];
const KPI_DE = [['Realisiertes\nMietvertrags-\nvolumen', '104.370.400', '€'], ['Entwickelte\nGrund- und\nNutzfläche', '235.300', 'm²'], ['Realisiertes\nProjekt-\nvolumen', '168.400.000', '€']];
const KPI_RU = [['Реализованный\nобъём аренды', '104.370.400', '€'], ['Освоенная\nземельная и\nполезная\nплощадь', '235.300', 'm²'], ['Реализованный\nобъём\nпроектов', '168.400.000', '€']];

const W = 393, H = 852, CX = 196.5, CY = 337, R0 = 102, AX = 116, AY = 95, IC = 56, FS = 12.5, GAP = 10;
const br = (s) => s.replace(/\n/g, '<br>');
const vlang = (l = 'de') => `<nav class="vlang">${['de', 'en', 'ru'].map((x) => `<a class="${x === l ? 'on' : ''}">${x.toUpperCase()}</a>`).join('<i></i>')}</nav>`;

/**
 * The constellation, with labels anchored to the *outer* edge of each icon.
 * Centred labels were the reason Russian broke: "СТРОИТЕЛЬСТВОМ" is ~152 px,
 * and centred over a corner icon it runs off the screen. Anchored outward, every
 * label grows toward the free space above/below the globe instead, and the four
 * of them form two clean vertical edges.
 *
 * `k` scales the whole constellation about the globe's centre — the markers are
 * attached to the orbit, so when the globe swells on the way down they ride out
 * past the screen edges with it: you fly through the ring.
 */
function constellation({ lang = 'de', k = 1, cy = CY, marks = [{}, {}, {}, {}], ring = 1, beam = null }) {
  const d = Math.hypot(AX, AY) * k;
  const lh = Math.round(FS * 1.34), labelH = lh * 2;
  const pos = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sy]) => [CX + sx * AX * k, cy + sy * AY * k, sx, sy]);
  const holes = pos.map(([x, y, sx, sy]) => {
    const ly = sy < 0 ? y - IC / 2 - GAP - labelH : y + IC / 2 + GAP;
    const lx = sx < 0 ? x - IC / 2 - 4 : x + IC / 2 - 166;
    return `<rect x="${lx}" y="${ly - 6}" width="170" height="${labelH + 12}" rx="6"/><rect x="${x - IC / 2 - 7}" y="${y - IC / 2 - 7}" width="${IC + 14}" height="${IC + 14}" rx="14"/>`;
  }).join('');
  const id = `m${Math.random().toString(36).slice(2, 8)}`;
  return `
  <svg class="orbit" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="opacity:${ring}">
    <defs><mask id="${id}"><rect width="${W}" height="${H}" fill="#fff"/><g fill="#000">${holes}</g></mask></defs>
    <g mask="url(#${id})"><circle cx="${CX}" cy="${cy}" r="${d}" class="orbit__ring"/><circle cx="${CX}" cy="${cy}" r="${d + 9}" class="orbit__ring orbit__ring--faint"/></g>
    ${beam ? `<defs><linearGradient id="${id}b" x1="${beam[0]}" y1="${beam[1]}" x2="${beam[2]}" y2="${beam[3]}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#9fdcff" stop-opacity=".9"/><stop offset="1" stop-color="#4ad8ff" stop-opacity=".35"/></linearGradient></defs>
      <line x1="${beam[0]}" y1="${beam[1]}" x2="${beam[2]}" y2="${beam[3]}" stroke="url(#${id}b)" stroke-width="1.2" class="beam"/>
      <circle cx="${beam[2]}" cy="${beam[3]}" r="13" class="beam__halo"/><circle cx="${beam[2]}" cy="${beam[3]}" r="3.4" class="beam__node"/>` : ''}
  </svg>
  ${pos.map(([x, y, sx, sy], i) => {
    const m = marks[i];
    const cls = `mk mk--${sy < 0 ? 'up' : 'down'} mk--o${sx < 0 ? 'l' : 'r'}${m.on ? ' is-on' : ''}`;
    return `<a class="${cls}" style="left:${x}px;top:${y}px;--ic:${IC}px;--fs:${FS}px;--gap:${GAP}px;opacity:${m.o ?? 1};filter:${m.blur ? `blur(${m.blur}px)` : 'none'};transform:translate(-50%,-50%) scale(${m.s ?? 1})">
      <span class="mk__glyph">${icon(ICONS[i])}</span>
      ${m.noLabel ? '' : `<span class="mk__label" style="opacity:${m.lo ?? 1}">${br(L[lang].divisions[IDS[i]].label)}</span>`}
    </a>`;
  }).join('')}`;
}

function lower(lang = 'de', o = 1, dy = 0) {
  const t = L[lang];
  const heading = (lang === 'de' ? t.kpiHeading.replace(' in den ', '<br>in den ') : t.kpiHeading.replace(' за ', '<br>за ')).replace(/\d+/, (n) => `<b class="sig">${n}</b>`);
  const kp = lang === 'de' ? KPI_DE : KPI_RU;
  return `
  <section class="low" style="top:${540 + dy}px;opacity:${o}">
    <p class="kh"><i></i><span>${heading}</span><i></i></p>
    <dl class="kg">${kp.map(([l, n, u]) => `<div class="kc"><dt>${br(l)}</dt><span class="kr"></span><dd>${n}<span>${u}</span></dd></div>`).join('')}</dl>
    <a class="pt"><span>${t.partnerLabel}</span><span class="seyband"><span class="seyband__word"><b>SEYBAND</b>GRUPPE</span><i class="r1"></i><i class="r2"></i></span></a>
    <footer class="ft"><span class="ft__co">${t.company}</span><span class="ft__links"><a>${t.imprint}</a><i></i><a>${t.privacy}</a></span></footer>
  </section>`;
}

const DOCK_X = [88.5, 160.5, 232.5, 304.5];
function dock({ on = 2, o = 1, dy = 0, ind = null }) {
  return `<nav class="dock" style="opacity:${o};transform:translate(-50%,${dy}px)">
    ${ICONS.map((ic, i) => `<button class="dock__btn${ind === null && i === on ? ' is-on' : ''}">${icon(ic)}</button>`).join('')}
    ${ind !== null ? `<span class="dock__ind" style="left:${ind - 48.5 - 32}px"></span>` : ''}
  </nav>`;
}

const detailText = (i, { o = 1, x = 0, blur = 0, bodyLines = null, eyebrowO = 1, num = i + 1 } = {}) => {
  const t = L.de.divisions[IDS[i]];
  return `<article class="det det2" style="opacity:${o};transform:translateX(${x}px);filter:${blur ? `blur(${blur}px)` : 'none'}">
    <p class="eyebrow eyebrow--accent" style="opacity:${eyebrowO}">${L.de.eyebrow} <span>0${num} / 04</span></p>
    <h1>${br(t.label)}</h1>
    <p class="det__body"${bodyLines ? ` style="-webkit-mask-image:linear-gradient(#000 ${bodyLines}px, transparent ${bodyLines + 30}px);mask-image:linear-gradient(#000 ${bodyLines}px, transparent ${bodyLines + 30}px)"` : ''}>${t.body}</p>
  </article>`;
};

const lock = (w, top, o = 1) => `<img class="lock" src="lockup.png" alt="" style="width:${w}px;top:${top}px;opacity:${o}">`;
const crownBar = (o = 1) => `<button class="back" style="opacity:${o}"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>Übersicht</button><img class="bar__crown bar__crown--detail" src="crown.png" alt="" style="opacity:${o}">`;

// node positions of London (division 3), straight from the engine
const LONDON = { s1: [208.1, 246.9] };

const rows = [
  {
    title: 'Ankunft', sub: 'Vom Logo zur Übersicht — der Einstieg',
    frames: [
      { plate: 'intro_393', t: '0.0 s', cap: 'Das Logo, exakt mittig. Nach 2 s erscheint der Hinweis.',
        body: `<span class="ping"></span><span class="ping ping--2"></span><img class="intro__mark" src="lockup.png" alt=""><p class="intro__cue"><i></i>Zum Betreten tippen<i></i></p>` },
      { plate: 'i3', t: '1.6 s', cap: 'Tipp: Die Sterne fallen zum Globus zusammen, das Logo steigt in einem Bogen nach oben.',
        body: lock(204, 128) + vlang() },
      { plate: 's1', t: '2.6 s', cap: 'Erst leuchten die Städte, dann zeichnet sich der Orbit, dann treten die vier Bereiche nacheinander aus der Unschärfe.',
        body: lock(184, 36) + vlang() + constellation({ ring: 0.45, marks: [{}, { o: 0.75, blur: 1.5 }, { o: 0.35, blur: 5 }, { o: 0.12, blur: 8 }] }) },
      { plate: 's1', t: '3.4 s', cap: 'Ruhezustand. Die Kennzahlen zählen hoch, sobald sie sichtbar sind.',
        body: lock(184, 36) + vlang() + constellation({}) + lower() },
    ],
  },
  {
    title: 'Abstieg', sub: 'Ein Bereich wird gewählt — kein Seitenwechsel, sondern eine Kamerafahrt',
    frames: [
      { plate: 's1', t: '0 ms', cap: 'Tipp: Das Symbol leuchtet auf, ein Lichtstrahl verbindet es mit seiner Stadt auf dem Globus. Die anderen treten zurück.',
        body: lock(184, 36) + vlang() + constellation({ beam: [80.5, 432, ...LONDON.s1], marks: [{ o: 0.35 }, { o: 0.35 }, { on: true, s: 0.96 }, { o: 0.35 }] }) + lower('de', 0.5) },
      { plate: 's2', t: '450 ms', cap: 'Der Globus schwillt an und sinkt, und dreht die gewählte Stadt nach vorn. Der Orbit hängt am Globus — die Symbole fliegen mit ihm nach außen aus dem Bild.',
        body: lock(132, 26, 0.45) + constellation({ k: 1.686, cy: 560, ring: 0.5, marks: [{ o: 0.4, noLabel: true }, { o: 0.4, noLabel: true }, { on: true, o: 0.75, noLabel: true }, { o: 0.4, noLabel: true }] })
          + `<p class="flying" style="left:34px;top:312px;font-size:20px">TRANSAKTIONS-<br>MANAGEMENT</p>` },
      { plate: 's3', t: '900 ms', cap: 'Man fliegt durch den Ring. Die gewählte Bezeichnung ist mitgekommen und wächst zur Überschrift; das Logo ist zur Krone geworden.',
        body: crownBar(0.6) + vlang() + detailText(2, { eyebrowO: 0.5, bodyLines: 52 }) + dock({ o: 0.55, dy: 26 }) },
      { plate: 's4', t: '1300 ms', cap: 'Gelandet. Der Globus ist der Horizont, der Text gehört dem Himmel. Die vier Bereiche kommen als Dock zurück.',
        body: crownBar() + vlang() + detailText(2) + dock({}) },
    ],
  },
  {
    title: 'Wechseln & zurück', sub: 'Innerhalb der Bereiche und wieder hinaus',
    frames: [
      { plate: 's5', t: 'Wischen', cap: 'Wischen irgendwo auf dem Bildschirm: Der Globus dreht live mit dem Finger zur nächsten Stadt, der Text gleitet in Wischrichtung, die Markierung im Dock folgt.',
        body: crownBar() + vlang() + detailText(2, { o: 0.18, x: -64, blur: 2 }) + detailText(3, { o: 0.78, x: 34, num: 4 }) + dock({ ind: 268 }) },
      { plate: 's3', t: 'Zurück', cap: '„Übersicht“, die Zurück-Geste oder Wischen vom Rand: exakt rückwärts. Der Ring zieht sich vom Bildrand zusammen, die Überschrift schrumpft in ihr Etikett zurück.',
        body: lock(150, 30, 0.55) + constellation({ k: 1.42, cy: 640, ring: 0.6, marks: [{ o: 0.5, noLabel: true }, { o: 0.5, noLabel: true }, { o: 0.8, noLabel: true }, { o: 0.5, noLabel: true }] })
          + `<p class="flying" style="left:42px;top:396px;font-size:17px;opacity:.85">TRANSAKTIONS-<br>MANAGEMENT</p>` },
      { plate: 'o2_393', t: 'Russisch', cap: 'Nach außen bündige Bezeichnungen: auch die längsten russischen Wörter passen, ohne Verkleinerung.',
        body: lock(184, 36) + vlang('ru') + constellation({ lang: 'ru' }) + lower('ru') },
    ],
  },
];

const css = ['concept.css', 'concept2.css', 'concept3.css'].map((f) => readFileSync(join(here, f), 'utf8')).join('\n');
writeFileSync(join(here, 'storyboard.html'), `<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Hamlet — Phone flow</title><style>${css}</style></head><body>
<header class="board__head"><h1>Hamlet Holding Group — der ganze Ablauf auf dem Telefon</h1>
<p>Jedes Globusbild ist ein echter Frame aus der Engine, an der Position, die das Layout verlangt.</p></header>
${rows.map((r, ri) => `
<section class="sb"><h2>${r.title}<span>${r.sub}</span></h2>
  <div class="sb__row">${r.frames.map((f, fi) => `
    <figure class="fig">
      <div class="frame" id="r${ri}f${fi}" style="width:${W}px;height:${H}px;background-image:url(plates/${f.plate}.jpg)">${f.body}</div>
      <figcaption><b>${f.t}</b><span>${f.cap}</span></figcaption>
    </figure>`).join('<span class="sb__arrow">→</span>')}
  </div></section>`).join('')}
</body></html>`);
console.log('wrote storyboard.html');
