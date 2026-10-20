import { Emitter } from './Emitter';

type Events = {
  resize: { width: number; height: number; dpr: number };
};

/**
 * Which composition the window gets.
 *
 * Phones are not small desktops. Below these sizes the overview stops being a
 * single fitted frame and becomes a scrolling page built around a large globe,
 * and the division view becomes a horizon with a dock. Decided from the
 * *visible* size — an iPhone 16 in Safari is 393x659, not 393x852.
 */
export type Form = 'phone' | 'phone-land' | 'default';

export function formFor(w: number, h: number): Form {
  if (w <= 600 && h >= w) return 'phone';
  if (h <= 500 && w > h) return 'phone-land';
  return 'default';
}

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
  form: Form = 'default';
  readonly isTouch: boolean;

  private timer = 0;
  private maxDpr: number;

  constructor(maxDpr = 2) {
    super();
    this.maxDpr = maxDpr;
    this.isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
    if (this.isTouch) this.maxDpr = Math.min(this.maxDpr, 1.75);
    this.measure();

    window.addEventListener('resize', this.schedule, { passive: true });
    window.addEventListener('orientationchange', this.schedule, { passive: true });
  }

  dispose(): void {
    clearTimeout(this.timer);
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
    this.form = formFor(w, h);
    if (document.documentElement.dataset.form !== this.form) {
      document.documentElement.dataset.form = this.form;
    }
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
