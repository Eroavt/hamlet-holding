/**
 * Drag the globe in the detail view to move between divisions.
 *
 * The globe follows the pointer one-to-one while dragging, so the gesture is
 * direct rather than a hidden swipe: you can see how far you have turned it and
 * whether letting go will commit. Past the threshold it lands on the next
 * division, short of it the caller snaps back to the current one.
 */
export class GlobeSwipe {
  /** Screen pixels of horizontal travel that commit to the next division. */
  private static readonly THRESHOLD = 105;
  /** Radians of globe rotation per screen pixel. */
  private static readonly RADIANS_PER_PX = 0.0055;

  private target: HTMLElement;
  private enabled = false;
  private pointerId: number | null = null;
  private startX = 0;
  private lastDelta = 0;

  /** Called continuously with the rotation delta in radians, and in pixels. */
  onDrag: ((radians: number, px: number) => void) | null = null;
  /** +1 = next division, -1 = previous. */
  onCommit: ((direction: 1 | -1) => void) | null = null;
  /** Released without reaching the threshold. */
  onCancel: (() => void) | null = null;
  /** Asked before a drag starts; lets the app refuse mid-transition. */
  canStart: (() => boolean) | null = null;
  /**
   * Whether a press on this element may start a drag. By default only the
   * canvas itself — on a desktop the copy is selectable text. On a phone App
   * widens it to the whole screen: a horizon you can only turn by finding it
   * is a gesture nobody discovers.
   */
  accepts: (target: EventTarget | null) => boolean = (t) => t === this.target;

  /** Horizontal travel before a press counts as a drag rather than a tap. */
  private static readonly SLOP = 8;
  private startY = 0;
  private dragging = false;

  constructor(target: HTMLElement) {
    this.target = target;
    window.addEventListener('pointerdown', this.onDown);
    window.addEventListener('pointermove', this.onMove, { passive: true });
    window.addEventListener('pointerup', this.onUp);
    window.addEventListener('pointercancel', this.onUp);
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    this.target.style.cursor = on ? 'grab' : '';
    if (!on && this.pointerId !== null) this.release(false);
  }

  private onDown = (e: PointerEvent): void => {
    if (!this.enabled || this.pointerId !== null) return;
    if (!this.accepts(e.target)) return;
    if (this.canStart && !this.canStart()) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.lastDelta = 0;
    this.dragging = false;
    this.target.style.cursor = 'grabbing';
  };

  private onMove = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    const dx = e.clientX - this.startX;
    if (!this.dragging) {
      // A vertical move is somebody scrolling the copy, not turning the globe.
      if (Math.abs(e.clientY - this.startY) > GlobeSwipe.SLOP && Math.abs(dx) < GlobeSwipe.SLOP) {
        this.release(false);
        return;
      }
      if (Math.abs(dx) < GlobeSwipe.SLOP) return;
      this.dragging = true;
    }
    this.lastDelta = dx;
    this.onDrag?.(this.lastDelta * GlobeSwipe.RADIANS_PER_PX, this.lastDelta);
  };

  private onUp = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    this.release(true);
  };

  private release(commit: boolean): void {
    const delta = this.lastDelta;
    const dragged = this.dragging;
    this.pointerId = null;
    this.lastDelta = 0;
    this.dragging = false;
    this.target.style.cursor = this.enabled ? 'grab' : '';

    if (!dragged) return;
    if (commit && Math.abs(delta) >= GlobeSwipe.THRESHOLD) {
      // Dragging the globe leftwards brings the next region round from the
      // right, so that direction reads as "forward".
      this.onCommit?.(delta < 0 ? 1 : -1);
    } else {
      this.onCancel?.();
    }
  }

  dispose(): void {
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
}
