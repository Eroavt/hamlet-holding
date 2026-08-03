export type TickFn = (dt: number, elapsed: number) => void;

/**
 * The single requestAnimationFrame loop for the whole application.
 *
 * Nothing else in the codebase is allowed to call rAF. Two loops means two
 * competing schedules, dropped frames and non-deterministic ordering — which
 * is exactly how "the animation jitters sometimes" bugs are born.
 */
export class Ticker {
  /** Seconds since start, paused while the tab is hidden. */
  elapsed = 0;
  /** Smoothed frames per second, used by the adaptive quality controller. */
  fps = 60;

  private subs: TickFn[] = [];
  private handle = 0;
  private last = 0;
  private running = false;

  constructor() {
    document.addEventListener('visibilitychange', this.onVisibility, { passive: true });
  }

  add(fn: TickFn): () => void {
    this.subs.push(fn);
    return () => {
      const i = this.subs.indexOf(fn);
      if (i >= 0) this.subs.splice(i, 1);
    };
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.handle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.handle);
  }

  dispose(): void {
    this.stop();
    this.subs.length = 0;
    document.removeEventListener('visibilitychange', this.onVisibility);
  }

  /**
   * Runs one synthetic frame without waiting for rAF. Only used by the dev
   * harness, which has to step the experience deterministically while the
   * page is not compositing.
   */
  pump(dt: number): void {
    this.elapsed += dt;
    for (let i = 0; i < this.subs.length; i++) this.subs[i](dt, this.elapsed);
  }

  private onVisibility = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private frame = (now: number): void => {
    this.handle = requestAnimationFrame(this.frame);

    // Clamp: after an alt-tab the delta can be seconds long, which would make
    // every time-integrated value explode on the first frame back.
    const raw = (now - this.last) / 1000;
    this.last = now;
    const dt = raw > 0.1 ? 0.016 : raw;

    this.elapsed += dt;
    this.fps += (1 / Math.max(dt, 0.0001) - this.fps) * 0.06;

    for (let i = 0; i < this.subs.length; i++) this.subs[i](dt, this.elapsed);
  };
}
