import gsap from 'gsap';
import { Vector3 } from 'three';
import { DIVISIONS, ICON_VIEWBOX, type Division } from '@/content/divisions';
import type { Dictionary } from '@/content/i18n';
import type { PhoneSolution } from './PhoneLayout';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Divisions whose glyph has been traced from supplied artwork and approved.
 *
 * The remaining fields render their frame only. Add an id here once its mark
 * is final — that is the single switch, no markup changes needed.
 */
const APPROVED_ICONS = new Set([
  'projectDevelopment',
  'realEstateInvestment',
  'transactionManagement',
  'constructionManagement',
]);

interface Tile {
  division: Division;
  root: HTMLButtonElement;
  inner: HTMLElement;
  name: HTMLElement;
  /** Unit-sphere direction of the point this division is anchored to. */
  dir: Vector3;
  /** Screen-space node on the globe, refreshed every frame. */
  node: SVGCircleElement;
  halo: SVGCircleElement;
  hot: boolean;
  /** Phone corner: -1 left / up, +1 right / down. */
  sx: number;
  sy: number;
  glyph: HTMLElement;
  /** Label box relative to the marker centre, measured once per layout. */
  labelBox: { x: number; y: number; w: number; h: number };
  maskLabel: SVGRectElement;
  maskGlyph: SVGRectElement;
}

/** Phone corners in division order: the reading order of the composition. */
const CORNERS: readonly [number, number][] = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

/** Matches gl/data/rasterizeLand.ts so the anchor lands where it should. */
function latLonToVec3(latDeg: number, lonDeg: number): Vector3 {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;
  const s = Math.sin(phi);
  return new Vector3(-s * Math.cos(theta), Math.cos(phi), s * Math.sin(theta));
}

export type Projector = (point: Vector3, out: { x: number; y: number }) => number;

/**
 * The divisions as annotations on the hologram.
 *
 * There are no buttons in the usual sense. Each division is a lit node on the
 * globe's surface, a hairline running out from it, and a piece of type at the
 * end — the visual language of an instrument readout rather than a nav bar.
 * The node is a real point in 3D: it turns with the globe and dims when it
 * passes behind the horizon, which is what ties the label to the object
 * instead of floating it on top.
 */
export class Hotspots {
  readonly el: HTMLElement;
  readonly svg: SVGSVGElement;
  private tiles: Tile[] = [];
  private scratch = { x: 0, y: 0 };
  private origin = new Vector3();

  /** Phone composition, or null on larger screens. */
  private phone: PhoneSolution | null = null;
  private ring: SVGCircleElement[] = [];
  private beamLine!: SVGLineElement;
  private beamHalo!: SVGCircleElement;
  private beamNode!: SVGCircleElement;
  /** 0..1 draw-in of the beam, and the tile it leaves from. */
  beam = { p: 0, o: 0 };
  private beamFrom: Tile | null = null;
  /** Last drawn state of the phone furniture, so a still globe costs nothing. */
  private drawn = '';

  onSelect: ((division: Division) => void) | null = null;
  onFocus: ((dir: Vector3 | null) => void) | null = null;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#hotspots')!;

    this.svg = document.createElementNS(SVG_NS, 'svg');
    this.svg.setAttribute('id', 'nodes');
    this.svg.setAttribute('aria-hidden', 'true');
    this.el.parentElement!.insertBefore(this.svg, this.el);

    this.build();
  }

  private build(): void {
    const frag = document.createDocumentFragment();

    // Phone furniture lives in the same full-screen svg as the nodes so it is
    // positioned in the same frame, from the same projection. The orbit is
    // masked wherever a label or an icon sits, so it reads as a line passing
    // behind them rather than through them.
    const defs = document.createElementNS(SVG_NS, 'defs');
    const mask = document.createElementNS(SVG_NS, 'mask');
    mask.setAttribute('id', 'orbit-mask');
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    const full = document.createElementNS(SVG_NS, 'rect');
    full.setAttribute('width', '10000');
    full.setAttribute('height', '10000');
    full.setAttribute('x', '-5000');
    full.setAttribute('y', '-5000');
    full.setAttribute('fill', '#fff');
    mask.append(full);
    defs.append(mask);
    const orbit = document.createElementNS(SVG_NS, 'g');
    orbit.setAttribute('class', 'orbit');
    orbit.setAttribute('mask', 'url(#orbit-mask)');
    for (const cls of ['orbit__ring', 'orbit__ring orbit__ring--outer']) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('class', cls);
      orbit.append(c);
      this.ring.push(c);
    }
    this.beamLine = document.createElementNS(SVG_NS, 'line');
    this.beamLine.setAttribute('class', 'beam');
    this.beamHalo = document.createElementNS(SVG_NS, 'circle');
    this.beamHalo.setAttribute('class', 'beam__halo');
    this.beamHalo.setAttribute('r', '12');
    this.beamNode = document.createElementNS(SVG_NS, 'circle');
    this.beamNode.setAttribute('class', 'beam__node');
    this.beamNode.setAttribute('r', '3.2');
    this.svg.append(defs, orbit, this.beamLine, this.beamHalo, this.beamNode);

    DIVISIONS.forEach((d, index) => {
      const [sx, sy] = CORNERS[index % CORNERS.length];
      const halo = document.createElementNS(SVG_NS, 'circle');
      halo.setAttribute('class', `node-halo node-halo--${d.accent}`);
      halo.setAttribute('r', '9');
      const node = document.createElementNS(SVG_NS, 'circle');
      node.setAttribute('class', `node node--${d.accent}`);
      node.setAttribute('r', '3.1');
      this.svg.append(halo, node);

      const root = document.createElement('button');
      root.type = 'button';
      root.className = 'hs';
      root.dataset.id = d.id;
      root.dataset.slug = d.slug;
      root.dataset.accent = d.accent;
      root.style.setProperty('--angle', `${d.angle}deg`);
      root.style.setProperty('--dist', `${d.dist}`);
      root.style.setProperty('--sx', String(sx));
      root.style.setProperty('--sy', String(sy));
      root.dataset.v = sy < 0 ? 'up' : 'down';
      root.dataset.h = sx < 0 ? 'left' : 'right';

      const inner = document.createElement('span');
      inner.className = 'hs__in';

      const name = document.createElement('span');
      name.className = 'hs__name';

      const glyph = document.createElement('span');
      glyph.className = 'hs__glyph';
      // Every field keeps its frame; only the divisions whose final mark has
      // been signed off render one. The rest stay empty until their artwork
      // arrives — an approximate glyph is worse than none.
      if (APPROVED_ICONS.has(d.id)) {
        glyph.innerHTML = `<svg viewBox="${ICON_VIEWBOX}" aria-hidden="true">${d.icon}</svg>`;
      }

      const rule = document.createElement('span');
      rule.className = 'hs__rule';

      inner.append(name, glyph, rule);
      root.append(inner);
      frag.append(root);

      const maskLabel = document.createElementNS(SVG_NS, 'rect');
      const maskGlyph = document.createElementNS(SVG_NS, 'rect');
      for (const r of [maskLabel, maskGlyph]) {
        r.setAttribute('fill', '#000');
        r.setAttribute('rx', '10');
        mask.append(r);
      }

      const t: Tile = {
        division: d,
        root,
        inner,
        name,
        dir: latLonToVec3(d.lat, d.lon),
        node,
        halo,
        hot: false,
        sx,
        sy,
        glyph,
        labelBox: { x: 0, y: 0, w: 0, h: 0 },
        maskLabel,
        maskGlyph,
      };
      this.tiles.push(t);

      root.addEventListener('pointerenter', () => this.enter(t));
      root.addEventListener('pointerleave', () => this.leave());
      root.addEventListener('focus', () => this.enter(t));
      root.addEventListener('blur', () => this.leave());
      root.addEventListener('click', () => this.onSelect?.(d));
    });

    this.el.append(frag);
  }

  private enter(t: Tile): void {
    t.hot = true;
    t.root.classList.add('is-hot');
    this.onFocus?.(t.dir);
    document.getElementById('cursor')?.classList.add('is-hot');
  }

  private leave(): void {
    for (const t of this.tiles) {
      t.hot = false;
      t.root.classList.remove('is-hot');
    }
    this.onFocus?.(null);
    document.getElementById('cursor')?.classList.remove('is-hot');
  }

  /** Switches the constellation between the phone composition and the ring. */
  setPhone(sol: PhoneSolution | null): void {
    this.phone = sol;
    const st = document.documentElement.style;
    if (!sol) return;
    st.setProperty('--mk-ax', sol.axR.toFixed(4));
    st.setProperty('--mk-ay', sol.ayR.toFixed(4));
    st.setProperty('--mk-ic', `${sol.ic}px`);
    st.setProperty('--mk-fs', `${sol.fs.toFixed(2)}px`);
    st.setProperty('--mk-gap', `${sol.gap}px`);
  }

  /**
   * How far the labels overflow the room they have, as a ratio (above 1 means
   * they do not fit). Labels are centred on their icons, so two limits apply:
   * the pair in a row must not meet in the middle, and no label may run off
   * the edge of the screen. The longest Russian labels break both on a narrow
   * phone at full size; App scales the type by this ratio.
   */
  rowFill(): number {
    if (!this.phone) return 0;
    const ax = this.phone.axR * this.phone.R;
    const W = window.innerWidth;
    const margin = 10;
    let worst = 0;
    for (const sy of [-1, 1]) {
      const row = this.tiles.filter((t) => t.sy === sy);
      const halves = row.map((t) => t.name.scrollWidth / 2);
      // Centres are 2·ax apart; the two halves plus a gap must fit between.
      worst = Math.max(worst, (halves.reduce((s, h) => s + h, 0) + 16) / (2 * ax));
      for (const t of row) {
        const centre = W / 2 + t.sx * ax;
        const room = Math.min(centre, W - centre) - margin;
        worst = Math.max(worst, t.name.scrollWidth / 2 / room);
      }
    }
    return worst;
  }

  /** Half the width of each label, with its corner, at the current type. */
  labelHalves(): { sx: number; sy: number; half: number }[] {
    return this.tiles.map((t) => ({ sx: t.sx, sy: t.sy, half: t.name.scrollWidth / 2 }));
  }

  /** Widest label, for the landscape solve — measured, since it is per language. */
  widestLabel(): number {
    return Math.max(0, ...this.tiles.map((t) => t.name.scrollWidth));
  }

  /**
   * Where each label sits relative to its marker, for the orbit mask. Labels
   * only move with the marker as a whole, so this is measured on layout, not
   * per frame.
   */
  measureLabels(): void {
    this.drawn = '';
    for (const t of this.tiles) {
      // Screen rects, relative to the glyph: labels are centred with a
      // transform, which offsetLeft would not see. Both sit inside the same
      // marker, so any transform on the marker itself cancels out.
      const g = t.glyph.getBoundingClientRect();
      const n = t.name.getBoundingClientRect();
      const gx = g.left + g.width / 2;
      const gy = g.top + g.height / 2;
      t.labelBox = { x: n.left - gx - 6, y: n.top - gy - 4, w: n.width + 12, h: n.height + 8 };
    }
  }

  /**
   * Phone overview: how present the constellation is while the second screen
   * rises over it (1 = fully, 0 = gone). Set on the marker roots and the
   * orbit's circles — elements no transition ever tweens, so this can never
   * fight a timeline over the same property.
   */
  setRecede(v: number): void {
    const o = v.toFixed(3);
    const gone = v < 0.02;
    for (const t of this.tiles) {
      t.root.style.opacity = o;
      t.root.style.visibility = gone ? 'hidden' : '';
    }
    for (const c of this.ring) c.style.opacity = o;
  }

  /** Marks the division whose page is open, for the dock. */
  setActive(slug: string | null): void {
    for (const t of this.tiles) t.root.classList.toggle('is-active', t.division.slug === slug);
  }

  tileFor(slug: string): { root: HTMLElement; name: HTMLElement; glyph: HTMLElement } | null {
    const t = this.tiles.find((x) => x.division.slug === slug);
    return t ? { root: t.root, name: t.name, glyph: t.glyph } : null;
  }

  setCopy(d: Dictionary): void {
    for (const t of this.tiles) {
      const copy = d.divisions[t.division.id];
      if (!copy) continue;
      t.name.textContent = copy.label;
      t.root.setAttribute('aria-label', copy.title);
    }
  }

  /**
   * Places the nodes. Called every frame with a projector that returns the
   * screen position of a world point plus how much it faces the camera, and
   * the globe's projected radius including any scale on the world root.
   *
   * The nodes carry the connection to the globe on their own — a lit point
   * over the real city, turning with the sphere and dimming as it passes the
   * horizon. Drawing a line from there to the label only added clutter across
   * the middle of the composition.
   */
  update(project: Projector, spin: number, radius: number): void {
    if (!this.el.classList.contains('is-live')) return;
    if (this.phone) {
      this.updatePhone(project, radius);
      return;
    }

    const axis = new Vector3(0, 1, 0);
    const world = new Vector3();

    for (const t of this.tiles) {
      world.copy(t.dir).applyAxisAngle(axis, spin).multiplyScalar(1.005);
      const facing = project(world, this.scratch);
      const nx = this.scratch.x;
      const ny = this.scratch.y;

      t.node.setAttribute('cx', nx.toFixed(1));
      t.node.setAttribute('cy', ny.toFixed(1));
      t.halo.setAttribute('cx', nx.toFixed(1));
      t.halo.setAttribute('cy', ny.toFixed(1));

      // Behind the horizon: keep the node visible but clearly recessed, so
      // the composition stays stable while the globe turns.
      const front = facing > 0 ? 1 : 0.2;
      t.node.style.opacity = String(front * (t.hot ? 1 : 0.85));
      t.halo.style.opacity = String(t.hot ? front * 0.55 : 0);
      t.halo.setAttribute('r', String(t.hot ? radius * 0.075 + 8 : 9));
    }
  }

  /**
   * Phone: the orbit through the four markers, its mask, and the beam. All of
   * it is derived from the projected globe, so it rides with the sphere through
   * the descent exactly as the markers do.
   */
  private updatePhone(project: Projector, R: number): void {
    const sol = this.phone!;
    this.origin.set(0, 0, 0);
    project(this.origin, this.scratch);
    const cx = this.scratch.x;
    const cy = this.scratch.y;
    // The ring and its mask only change when the globe moves or the beam
    // draws. Rewriting a full-screen mask every frame regardless is a real
    // cost on a phone GPU for a picture that has not changed.
    const docked = this.el.classList.contains('is-rail');
    const key = `${cx.toFixed(1)}|${cy.toFixed(1)}|${R.toFixed(1)}|${this.beam.p.toFixed(3)}|${this.beam.o.toFixed(3)}|${docked}`;
    if (key === this.drawn) return;
    this.drawn = key;
    const d = Math.hypot(sol.axR, sol.ayR) * R;

    this.ring[0].setAttribute('cx', cx.toFixed(1));
    this.ring[0].setAttribute('cy', cy.toFixed(1));
    this.ring[0].setAttribute('r', d.toFixed(1));
    this.ring[1].setAttribute('cx', cx.toFixed(1));
    this.ring[1].setAttribute('cy', cy.toFixed(1));
    this.ring[1].setAttribute('r', (d + 9).toFixed(1));

    for (const t of this.tiles) {
      const mx = cx + t.sx * sol.axR * R;
      const my = cy + t.sy * sol.ayR * R;
      const b = t.labelBox;
      t.maskLabel.setAttribute('x', (mx + b.x).toFixed(1));
      t.maskLabel.setAttribute('y', (my + b.y).toFixed(1));
      t.maskLabel.setAttribute('width', docked ? '0' : b.w.toFixed(1));
      t.maskLabel.setAttribute('height', b.h.toFixed(1));
      const g = sol.ic + 14;
      t.maskGlyph.setAttribute('x', (mx - g / 2).toFixed(1));
      t.maskGlyph.setAttribute('y', (my - g / 2).toFixed(1));
      t.maskGlyph.setAttribute('width', String(g));
      t.maskGlyph.setAttribute('height', String(g));
    }

    // The beam: from the chosen icon to the point on the sphere that faces it.
    // The division is not *somewhere* on the planet — it reaches into it.
    const from = this.beamFrom;
    if (from && this.beam.o > 0.001) {
      const mx = cx + from.sx * sol.axR * R;
      const my = cy + from.sy * sol.ayR * R;
      const ux = mx - cx;
      const uy = my - cy;
      const len = Math.hypot(ux, uy) || 1;
      const ex = cx + (ux / len) * R * 0.72;
      const ey = cy + (uy / len) * R * 0.72;
      // Start at the icon's edge, not its centre, so the line leaves the frame.
      const sxp = mx - (ux / len) * (sol.ic * 0.55);
      const syp = my - (uy / len) * (sol.ic * 0.55);
      const total = Math.hypot(ex - sxp, ey - syp);
      this.beamLine.setAttribute('x1', sxp.toFixed(1));
      this.beamLine.setAttribute('y1', syp.toFixed(1));
      this.beamLine.setAttribute('x2', ex.toFixed(1));
      this.beamLine.setAttribute('y2', ey.toFixed(1));
      this.beamLine.style.strokeDasharray = `${total.toFixed(1)}`;
      this.beamLine.style.strokeDashoffset = `${(total * (1 - this.beam.p)).toFixed(1)}`;
      for (const c of [this.beamHalo, this.beamNode]) {
        c.setAttribute('cx', ex.toFixed(1));
        c.setAttribute('cy', ey.toFixed(1));
      }
      const tip = Math.max(0, (this.beam.p - 0.8) / 0.2);
      this.beamLine.style.opacity = String(this.beam.o);
      this.beamNode.style.opacity = String(this.beam.o * tip);
      this.beamHalo.style.opacity = String(this.beam.o * tip * 0.8);
    } else {
      this.beamLine.style.opacity = '0';
      this.beamNode.style.opacity = '0';
      this.beamHalo.style.opacity = '0';
    }
  }

  /**
   * Phone, leaving the overview for a division.
   *
   * Nothing here moves a marker: they are attached to the globe through CSS,
   * so as App swells and sinks the sphere they fly out through the screen
   * edges on their own. This only decides who is lit, what fades, and when the
   * row of four becomes the dock.
   */
  departPhone(slug: string): gsap.core.Timeline {
    const chosen = this.tiles.find((t) => t.division.slug === slug)!;
    const others = this.tiles.filter((t) => t !== chosen);
    this.beamFrom = chosen;
    this.tiles.forEach((t) => (t.root.tabIndex = -1));
    const tl = gsap.timeline();

    tl.add(() => chosen.root.classList.add('is-pressed'), 0);
    tl.fromTo(this.beam, { p: 0, o: 1 }, { p: 1, duration: 0.3, ease: 'power2.out' }, 0);
    tl.to(others.map((t) => t.inner), { opacity: 0.3, duration: 0.25, ease: 'power2.out' }, 0);
    tl.to(others.map((t) => t.name), { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.22);
    // The orbit and the icons stay lit while the globe carries them outward —
    // passing through the ring is the point — and only go as they reach the
    // edges of the screen.
    tl.to(this.beam, { o: 0, duration: 0.4, ease: 'power2.in' }, 0.42);
    tl.to(this.svg.querySelector('.orbit'), { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0.8);
    tl.to(others.map((t) => t.inner), { opacity: 0.55, duration: 0.3, ease: 'power2.out' }, 0.45);
    tl.to(this.tiles.map((t) => t.glyph), { opacity: 0, duration: 0.45, ease: 'power2.in' }, 0.9);
    return tl;
  }

  /** The four come back as the dock — called once the globe has landed. */
  dockPhone(slug: string): gsap.core.Timeline {
    const tl = gsap.timeline();
    tl.add(() => {
      this.el.classList.add('is-rail');
      this.setActive(slug);
      for (const t of this.tiles) {
        t.root.classList.remove('is-pressed');
        t.root.tabIndex = 0;
        gsap.set(t.inner, { opacity: 1 });
        gsap.set(t.name, { opacity: 0 });
        gsap.set(t.glyph, { opacity: 1 });
      }
    });
    // immediateRender off: this timeline is built at the tap, a second before
    // it plays, and a fromTo would otherwise hide the constellation at once.
    tl.fromTo(
      this.el,
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', immediateRender: false },
    );
    return tl;
  }

  /**
   * Phone, back to the overview. The dock goes, the markers reappear where the
   * still-large globe puts them — off the screen edges — and ride back in as
   * App shrinks it. The chosen label is restored by App once its headline has
   * flown back into it.
   */
  returnPhone(slug: string | null): gsap.core.Timeline {
    const tl = gsap.timeline();
    tl.to(this.el, { opacity: 0, y: 20, duration: 0.25, ease: 'power2.in' }, 0);
    tl.add(() => {
      this.el.classList.remove('is-rail');
      this.setActive(null);
      for (const t of this.tiles) {
        gsap.set(t.inner, { opacity: 1 });
        gsap.set(t.glyph, { opacity: 0 });
        gsap.set(t.name, { opacity: 0 });
      }
      gsap.set(this.el, { y: 0, opacity: 1 });
    });
    tl.to(this.tiles.map((t) => t.glyph), { opacity: 1, duration: 0.6, ease: 'power2.out', stagger: 0.05 }, 0.3);
    tl.to(
      this.tiles.filter((t) => t.division.slug !== slug).map((t) => t.name),
      { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.05 },
      0.65,
    );
    tl.to(this.svg.querySelector('.orbit'), { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.7);
    return tl;
  }

  /**
   * Where a marker's label will be once the globe is back at rest — the
   * landing point for a headline flying home before the globe has arrived.
   */
  restLabelRect(slug: string, cx: number, cy: number, R: number): DOMRect | null {
    const t = this.tiles.find((x) => x.division.slug === slug);
    if (!t || !this.phone) return null;
    const mx = cx + t.sx * this.phone.axR * R;
    const my = cy + t.sy * this.phone.ayR * R;
    const b = t.labelBox;
    return new DOMRect(mx + b.x + 6, my + b.y + 4, b.w - 12, b.h - 8);
  }

  /** The label element a headline flies out of and back into. */
  labelOf(slug: string): HTMLElement | null {
    return this.tiles.find((t) => t.division.slug === slug)?.name ?? null;
  }

  reveal(instant = false): gsap.core.Timeline {
    this.el.classList.add('is-live');
    const tl = gsap.timeline();
    tl.set(this.el, { opacity: 1 });
    tl.set(this.svg, { opacity: 1 });

    const inners = this.tiles.map((t) => t.inner);

    if (instant) {
      tl.set(inners, { x: 0, filter: 'blur(0px)', willChange: 'auto' });
      tl.to(inners, { opacity: 1, duration: 0.25, ease: 'none' });
      tl.to(this.svg, { opacity: 1, duration: 0.25, ease: 'none' }, 0);
      return tl;
    }

    // The nodes light up first, then the type arrives — the places exist
    // before they are named.
    tl.fromTo(
      this.svg,
      { opacity: 0 },
      { opacity: 1, duration: 0.9, ease: 'power2.out' },
      0.35,
    );
    tl.to(
      inners,
      {
        opacity: 1,
        x: 0,
        filter: 'blur(0px)',
        duration: 0.9,
        ease: 'power3.out',
        stagger: { each: 0.07 },
        onComplete: () => this.tiles.forEach((t) => (t.inner.style.willChange = 'auto')),
      },
      0,
    );
    return tl;
  }

  /**
   * Detail view: the six markers collapse into a rail of glyphs across the
   * globe's horizon. The labels and nodes go — at that altitude the annotation
   * language no longer applies, and the icons alone keep the other five
   * divisions one click away.
   *
   * CSS does the placement (`#hotspots.is-rail`); GSAP only crossfades, so the
   * two layouts never fight over the same transform.
   */
  toRail(): gsap.core.Timeline {
    const tl = gsap.timeline();
    const inners = this.tiles.map((t) => t.inner);

    tl.to(this.svg, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
    tl.to(inners, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 0);
    tl.add(() => {
      this.el.classList.add('is-rail');
      gsap.set(inners, { x: 0, filter: 'blur(0px)' });
    });
    tl.to(inners, {
      opacity: 1,
      duration: 0.55,
      ease: 'power2.out',
      stagger: { each: 0.05, from: 'center' },
    });
    return tl;
  }

  hideAllExcept(slug: string | null): gsap.core.Timeline {
    const tl = gsap.timeline();
    const others = this.tiles.filter((t) => t.division.slug !== slug);
    tl.to(this.svg, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);
    tl.to(
      others.map((t) => t.inner),
      { opacity: 0, x: 14, filter: 'blur(6px)', duration: 0.5, ease: 'power2.in', stagger: 0.03 },
      0,
    );
    others.forEach((t) => (t.root.tabIndex = -1));
    return tl;
  }

  restore(): gsap.core.Timeline {
    this.tiles.forEach((t) => (t.root.tabIndex = 0));
    const inners = this.tiles.map((t) => t.inner);
    const tl = gsap.timeline();

    tl.to(inners, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
    tl.add(() => this.el.classList.remove('is-rail'));
    tl.to(this.svg, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 0.45);
    tl.to(
      inners,
      { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out', stagger: 0.04 },
      0.35,
    );
    return tl;
  }

  setEnabled(on: boolean): void {
    this.el.style.pointerEvents = on ? '' : 'none';
  }
}
