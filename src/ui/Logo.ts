import gsap from 'gsap';

const BASE_WIDTH = 400; // must match #logo { width } in ui.css

interface Rect {
  x: number;
  y: number;
  w: number;
}

/**
 * The mark is the call to action *and* the wordmark.
 *
 * It is one DOM node for the whole lifetime of the page. The move from the
 * centre of the universe up into the header is a FLIP: measure the two
 * anchors that normal layout produced, then drive a single transform between
 * them. No crossfade, no second element, no reflow — so it physically cannot
 * jump, and it stays correct at any viewport because the anchors are re-measured
 * on resize.
 */
export class Logo {
  readonly el: HTMLButtonElement;
  private breathe: HTMLElement;
  private pings: HTMLElement[];
  private heroAnchor: HTMLElement;
  private headAnchor: HTMLElement;

  private hero: Rect = { x: 0, y: 0, w: 400 };
  private head: Rect = { x: 0, y: 0, w: 140 };
  private travel = 0;

  private moveX!: (v: number) => void;
  private moveY!: (v: number) => void;
  private idleTimer = 0;
  private loops: gsap.core.Timeline[] = [];
  private reduced: boolean;
  /** True once the mark has stopped being the call to action. */
  private settled = false;

  onActivate: (() => void) | null = null;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLButtonElement>('#logo')!;
    this.breathe = this.el.querySelector<HTMLElement>('.logo__breathe')!;
    this.pings = Array.from(this.el.querySelectorAll<HTMLElement>('.ping'));
    this.heroAnchor = root.querySelector<HTMLElement>('#anchor-hero')!;
    this.headAnchor = root.querySelector<HTMLElement>('#anchor-header')!;
    this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.moveX = gsap.quickTo(this.breathe, 'x', { duration: 0.7, ease: 'power3.out' });
    this.moveY = gsap.quickTo(this.breathe, 'y', { duration: 0.7, ease: 'power3.out' });

    this.el.addEventListener('click', () => this.onActivate?.());
    this.el.addEventListener('pointerenter', this.onEnter);
    this.el.addEventListener('pointerleave', this.onLeave);
    this.el.addEventListener('pointermove', this.onMove);
  }

  measure(): void {
    const a = this.heroAnchor.getBoundingClientRect();
    const b = this.headAnchor.getBoundingClientRect();
    this.hero = { x: a.left, y: a.top, w: a.width };
    this.head = { x: b.left, y: b.top, w: b.width };
    this.place(this.travel);
  }

  /** Tween target for the FLIP journey — see App.enter(). */
  get t(): number {
    return this.travel;
  }

  set t(v: number) {
    this.place(v);
  }

  /** 0 = centre of the universe, 1 = parked in the header. */
  place(t: number): void {
    this.travel = t;
    const s = gsap.utils.interpolate(this.hero.w, this.head.w, t) / BASE_WIDTH;
    const x = gsap.utils.interpolate(this.hero.x, this.head.x, t);
    // A slight bow, so it arcs rather than slides on a ruler.
    const bow = -Math.sin(t * Math.PI) * 28;
    const y = gsap.utils.interpolate(this.hero.y, this.head.y, t) + bow;
    gsap.set(this.el, { x, y, scale: s });
  }

  /** Starts the breathing and the radar pings. */
  awaken(): void {
    this.settled = false;
    if (this.reduced) return;

    this.loops.push(
      gsap
        .timeline({ repeat: -1, yoyo: true })
        .to(this.breathe, { scale: 1.028, duration: 2.1, ease: 'sine.inOut' }),
    );

    this.pings.forEach((ping, i) => {
      const tl = gsap
        .timeline({ repeat: -1, delay: i * 1.7 })
        .fromTo(
          ping,
          { scale: 0.34, opacity: 0 },
          { scale: 0.95, opacity: 0.5, duration: 0.85, ease: 'power2.out' },
        )
        .to(ping, { scale: 2.35, opacity: 0, duration: 2.55, ease: 'power2.out' })
        .to({}, { duration: 0.3 });
      this.loops.push(tl);
    });

    this.armIdleNudge();
  }

  /**
   * After a while without input, insist a little harder.
   *
   * Only ever while the mark still *is* the call to action. Once it has moved
   * into the header it is a wordmark, and a wordmark that keeps pulsing reads
   * as a glitch — `onLeave` re-arms this on every pointer exit, which is how
   * it kept firing on the selection screen.
   */
  private armIdleNudge(): void {
    clearTimeout(this.idleTimer);
    if (this.reduced || this.settled) return;
    this.idleTimer = window.setTimeout(() => {
      gsap
        .timeline()
        .to(this.breathe, { scale: 1.075, duration: 0.34, ease: 'power2.out' })
        .to(this.breathe, { scale: 1.0, duration: 0.75, ease: 'elastic.out(1, 0.45)' })
        .to(this.breathe, { scale: 1.05, duration: 0.28, ease: 'power2.out' }, '-=0.35')
        .to(this.breathe, { scale: 1.0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      this.armIdleNudge();
    }, 8000);
  }

  private onEnter = (): void => {
    clearTimeout(this.idleTimer);
    document.getElementById('cursor')?.classList.add('is-hot');
  };

  private onLeave = (): void => {
    this.moveX(0);
    this.moveY(0);
    document.getElementById('cursor')?.classList.remove('is-hot');
    this.armIdleNudge();
  };

  /** Magnetism, capped at 8 px — enough to feel alive, not enough to wobble. */
  private onMove = (e: PointerEvent): void => {
    if (this.travel > 0.02) return;
    const r = this.el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    this.moveX(gsap.utils.clamp(-8, 8, dx * 9));
    this.moveY(gsap.utils.clamp(-8, 8, dy * 9));
  };

  /** Stops the idle behaviour once the user has committed. */
  settle(): void {
    this.settled = true;
    clearTimeout(this.idleTimer);
    this.loops.forEach((tl) => tl.kill());
    this.loops.length = 0;
    gsap.to(this.pings, { opacity: 0, duration: 0.3 });
    gsap.to(this.breathe, { scale: 1, x: 0, y: 0, duration: 0.5, ease: 'power2.out' });
  }

  setLabel(text: string): void {
    this.el.setAttribute('aria-label', text);
  }

  dispose(): void {
    clearTimeout(this.idleTimer);
    this.loops.forEach((tl) => tl.kill());
    this.el.removeEventListener('pointerenter', this.onEnter);
    this.el.removeEventListener('pointerleave', this.onLeave);
    this.el.removeEventListener('pointermove', this.onMove);
  }
}
