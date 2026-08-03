import gsap from 'gsap';
import { Vector3 } from 'three';
import { DIVISIONS, ICON_VIEWBOX, type Division } from '@/content/divisions';
import { ICONS } from '@/content/icons';
import type { Dictionary } from '@/content/i18n';

const SVG_NS = 'http://www.w3.org/2000/svg';

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
}

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
  /** Hoisted out of update() — it runs every frame and must not allocate. */
  private readonly axis = new Vector3(0, 1, 0);
  private readonly world = new Vector3();

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

    DIVISIONS.forEach((d) => {
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

      const inner = document.createElement('span');
      inner.className = 'hs__in';

      const name = document.createElement('span');
      name.className = 'hs__name';

      const glyph = document.createElement('span');
      glyph.className = 'hs__glyph';
      glyph.innerHTML = `<svg viewBox="${ICON_VIEWBOX}" aria-hidden="true">${ICONS[d.id] ?? ''}</svg>`;

      const rule = document.createElement('span');
      rule.className = 'hs__rule';

      inner.append(name, glyph, rule);
      root.append(inner);
      frag.append(root);

      const t: Tile = {
        division: d,
        root,
        inner,
        name,
        dir: latLonToVec3(d.lat, d.lon),
        node,
        halo,
        hot: false,
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
   * screen position of a world point plus how much it faces the camera.
   *
   * The nodes carry the connection to the globe on their own — a lit point
   * over the real city, turning with the sphere and dimming as it passes the
   * horizon. Drawing a line from there to the label only added clutter across
   * the middle of the composition.
   */
  update(project: Projector, spin: number, radius: number): void {
    if (!this.el.classList.contains('is-live')) return;

    for (const t of this.tiles) {
      this.world.copy(t.dir).applyAxisAngle(this.axis, spin).multiplyScalar(1.005);
      const facing = project(this.world, this.scratch);
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
