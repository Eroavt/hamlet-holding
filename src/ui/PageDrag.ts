/**
 * Phone overview: lets a vertical drag that starts on a control still move
 * the page.
 *
 * The page's links and buttons sit above the native scroller (they have to —
 * the scroller only supplies physics, see App.applyScroll), so a thumb that
 * lands on a division icon or the partner link would otherwise scroll nothing.
 * Those controls are set to `touch-action: none` on the phone overview, and a
 * drag that starts on one is carried to the scroller by hand. On release it
 * settles on whichever screen the gesture was heading for. A press that does
 * not travel stays a tap.
 */
export class PageDrag {
  private static readonly SLOP = 8;
  /** px per ms: faster than this, the direction decides, not the position. */
  private static readonly FLICK = 0.35;

  private id: number | null = null;
  private startY = 0;
  private startTop = 0;
  private dragging = false;
  private samples: { y: number; t: number }[] = [];

  /** Asked on every press; App allows it only on the phone overview. */
  active: () => boolean = () => false;
  /** Height of one screen — where the second one starts. */
  screen: () => number = () => window.innerHeight;

  constructor(
    root: HTMLElement,
    private scroller: HTMLElement,
  ) {
    root.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
    // A drag must not end as a click on whatever it started on.
    root.addEventListener(
      'click',
      (e) => {
        if (!this.swallow) return;
        this.swallow = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      },
      true,
    );
  }

  private swallow = false;

  private onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'mouse' || this.id !== null || !this.active()) return;
    if (!(e.target instanceof Element) || !e.target.closest('a, button')) return;
    this.id = e.pointerId;
    this.startY = e.clientY;
    this.startTop = this.scroller.scrollTop;
    this.dragging = false;
    this.swallow = false;
    this.samples = [{ y: e.clientY, t: e.timeStamp }];
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.id) return;
    const dy = e.clientY - this.startY;
    if (!this.dragging) {
      if (Math.abs(dy) < PageDrag.SLOP) return;
      this.dragging = true;
      // Free while held, so the page follows the finger exactly.
      this.scroller.dataset.free = '';
    }
    this.scroller.scrollTop = this.startTop - dy;
    this.samples.push({ y: e.clientY, t: e.timeStamp });
    if (this.samples.length > 6) this.samples.shift();
  };

  private onUp = (e: PointerEvent): void => {
    if (e.pointerId !== this.id) return;
    this.id = null;
    if (!this.dragging) return;
    this.dragging = false;
    this.swallow = true;
    // The click (if any) fires right after pointerup; clear the flag after it.
    setTimeout(() => (this.swallow = false), 0);

    const a = this.samples[0];
    const b = this.samples[this.samples.length - 1];
    const v = (b.y - a.y) / Math.max(1, b.t - a.t);
    const H = this.screen();
    const top = this.scroller.scrollTop;
    const second = Math.abs(v) > PageDrag.FLICK ? v < 0 : top > H / 2;
    delete this.scroller.dataset.free;
    this.scroller.scrollTo({ top: second ? H : 0, behavior: 'smooth' });
  };
}
