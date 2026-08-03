import { Emitter } from './Emitter';

type Events = {
  resize: { width: number; height: number; dpr: number };
};

/**
 * Single source of truth for size and pixel density.
 *
 * Resize is debounced and gated on the *pixel* size actually changing. On
 * mobile the address bar collapsing fires a stream of resize events with an
 * unchanged width — reacting to those makes the canvas visibly stutter while
 * scrolling.
 */
export class Viewport extends Emitter<Events> {
  width = 0;
  height = 0;
  dpr = 1;
  aspect = 1;
  readonly isTouch: boolean;

  private timer = 0;
  private maxDpr: number;
  private observer?: ResizeObserver;

  constructor(maxDpr = 2) {
    super();
    this.maxDpr = maxDpr;
    this.isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
    if (this.isTouch) this.maxDpr = Math.min(this.maxDpr, 1.75);
    this.measure();

    window.addEventListener('resize', this.schedule, { passive: true });
    window.addEventListener('orientationchange', this.schedule, { passive: true });

    // A window `resize` event is not guaranteed for every way the frame can
    // change size — an iframe being laid out, a bfcache restore, a devtools
    // dock. Observing the root element catches those; the emit is still gated
    // on the pixel size really changing, so this costs nothing when idle.
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.schedule);
      this.observer.observe(document.documentElement);
    }
  }

  /**
   * Re-measure once the first layout has happened.
   *
   * Construction can run before the document has a size — the measurement then
   * reads 0 x 0, and with nothing to correct it the canvas is allocated at
   * zero and the scene renders into nothing while the render loop happily
   * reports 60 fps.
   */
  revalidate(): void {
    requestAnimationFrame(() => {
      if (this.measure()) {
        this.emit('resize', { width: this.width, height: this.height, dpr: this.dpr });
      }
    });
  }

  dispose(): void {
    clearTimeout(this.timer);
    this.observer?.disconnect();
    window.removeEventListener('resize', this.schedule);
    window.removeEventListener('orientationchange', this.schedule);
    this.clear();
  }

  private schedule = (): void => {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(this.apply, 120);
  };

  private measure(): boolean {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);
    const changed = w !== this.width || h !== this.height || dpr !== this.dpr;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.aspect = w / Math.max(h, 1);
    return changed;
  }

  private apply = (): void => {
    if (!this.measure()) return;
    this.emit('resize', { width: this.width, height: this.height, dpr: this.dpr });
  };

  /** Lower the pixel-ratio ceiling at runtime (adaptive quality). */
  setMaxDpr(v: number): void {
    if (v === this.maxDpr) return;
    this.maxDpr = v;
    if (this.measure()) this.emit('resize', { width: this.width, height: this.height, dpr: this.dpr });
  }
}
