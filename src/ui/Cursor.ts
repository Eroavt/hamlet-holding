import gsap from 'gsap';

/** A ring that trails the pointer and opens up over anything interactive. */
export class Cursor {
  private el: HTMLElement;
  private toX: (v: number) => void;
  private toY: (v: number) => void;
  private enabled: boolean;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#cursor')!;
    this.enabled =
      !matchMedia('(hover: none), (pointer: coarse)').matches &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.toX = gsap.quickTo(this.el, 'x', { duration: 0.28, ease: 'power3.out' });
    this.toY = gsap.quickTo(this.el, 'y', { duration: 0.28, ease: 'power3.out' });

    if (this.enabled) {
      window.addEventListener('pointermove', this.onMove, { passive: true });
      window.addEventListener('pointerdown', this.onDown, { passive: true });
      window.addEventListener('pointerup', this.onUp, { passive: true });
    }
  }

  private onMove = (e: PointerEvent): void => {
    if (e.pointerType !== 'mouse') return;
    this.toX(e.clientX);
    this.toY(e.clientY);
    if (this.el.style.opacity !== '1') gsap.to(this.el, { opacity: 1, duration: 0.3 });
  };

  private onDown = (): void => {
    gsap.to(this.el, { scale: 0.82, duration: 0.18, ease: 'power2.out' });
  };

  private onUp = (): void => {
    gsap.to(this.el, { scale: 1, duration: 0.32, ease: 'power2.out' });
  };

  dispose(): void {
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointerup', this.onUp);
  }
}
