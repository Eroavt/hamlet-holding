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

  /** Called continuously with the rotation delta in radians. */
  onDrag: ((radians: number) => void) | null = null;
  /** +1 = next division, -1 = previous. */
  onCommit: ((direction: 1 | -1) => void) | null = null;
  /** Released without reaching the threshold. */
  onCancel: (() => void) | null = null;
  /** Asked before a drag starts; lets the app refuse mid-transition. */
  canStart: (() => boolean) | null = null;

  constructor(target: HTMLElement) {
    this.target = target;
    target.addEventListener('pointerdown', this.onDown);
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
    if (this.canStart && !this.canStart()) return;
    this.pointerId = e.pointerId;
    this.startX = e.clientX;
    this.lastDelta = 0;
    this.target.style.cursor = 'grabbing';
  };

  private onMove = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    this.lastDelta = e.clientX - this.startX;
    this.onDrag?.(this.lastDelta * GlobeSwipe.RADIANS_PER_PX);
  };

  private onUp = (e: PointerEvent): void => {
    if (this.pointerId !== e.pointerId) return;
    this.release(true);
  };

  private release(commit: boolean): void {
    const delta = this.lastDelta;
    this.pointerId = null;
    this.lastDelta = 0;
    this.target.style.cursor = this.enabled ? 'grab' : '';

    if (commit && Math.abs(delta) >= GlobeSwipe.THRESHOLD) {
      // Dragging the globe leftwards brings the next region round from the
      // right, so that direction reads as "forward".
      this.onCommit?.(delta < 0 ? 1 : -1);
    } else {
      this.onCancel?.();
    }
  }

  dispose(): void {
    this.target.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
  }
}
