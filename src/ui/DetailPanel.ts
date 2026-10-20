import gsap from 'gsap';
import { DIVISIONS, type Division } from '@/content/divisions';
import type { Dictionary } from '@/content/i18n';

/**
 * The division read-out. Structure and transitions are final; the copy is
 * placeholder until the real content arrives.
 */
export class DetailPanel {
  readonly el: HTMLElement;
  private eyebrow: HTMLElement;
  private title: HTMLElement;
  private body: HTMLElement;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#detail')!;
    this.eyebrow = root.querySelector<HTMLElement>('#detail-eyebrow')!;
    this.title = root.querySelector<HTMLElement>('#detail-title')!;
    this.body = root.querySelector<HTMLElement>('#detail-body')!;
    this.titleEl = this.title;
    // A clipped column loses its fade once it has been read to the end.
    this.body.addEventListener(
      'scroll',
      () => {
        const b = this.body;
        b.classList.toggle('is-end', b.scrollTop + b.clientHeight >= b.scrollHeight - 2);
      },
      { passive: true },
    );
  }

  readonly titleEl: HTMLElement;

  /**
   * On a phone the headline is the division's two-line *label*, not its title:
   * it is the same piece of type the visitor tapped, grown — the label flies
   * up and becomes it, so the line break has to be the same at both ends.
   */
  fill(division: Division, d: Dictionary, phone = false): void {
    const copy = d.divisions[division.id];
    const n = DIVISIONS.indexOf(division) + 1;
    const pad = (v: number): string => String(v).padStart(2, '0');
    this.eyebrow.textContent = d.eyebrow;
    if (phone) {
      const count = document.createElement('span');
      count.className = 'detail-count';
      count.textContent = `${pad(n)} / ${pad(DIVISIONS.length)}`;
      this.eyebrow.append(' ', count);
    }
    this.title.textContent = phone ? copy.label : copy.title;
    this.body.textContent = copy.body;
    this.body.scrollTop = 0;
  }

  /** Laid out but invisible, so a flight can measure where it has to land. */
  prepare(): void {
    this.el.hidden = false;
    gsap.set(this.el, { opacity: 1, x: 0 });
    gsap.set([this.eyebrow, this.title, this.body], { opacity: 0 });
  }

  /** Phone: everything but the headline, which arrives by flight. */
  showRest(): gsap.core.Timeline {
    return gsap.timeline().fromTo(
      [this.eyebrow, this.body],
      { opacity: 0, y: 14, filter: 'blur(5px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.65, ease: 'power3.out', stagger: 0.09 },
    );
  }

  /**
   * Phone, moving to the neighbouring division: the copy leaves in the
   * direction of the swipe and the next one arrives from the other side.
   * `refill` runs at the midpoint, while nothing is visible.
   */
  slide(direction: 1 | -1, refill: () => void): gsap.core.Timeline {
    const out = -direction * 56;
    return gsap
      .timeline()
      .to(this.el, { x: out, opacity: 0, duration: 0.22, ease: 'power2.in' })
      .add(refill)
      .set([this.eyebrow, this.title, this.body], { opacity: 1, y: 0, filter: 'blur(0px)' })
      .fromTo(
        this.el,
        { x: -out * 0.8, opacity: 0 },
        // Built before the outgoing half has played; rendering the incoming
        // state up front would make the copy jump before it slides.
        { x: 0, opacity: 1, duration: 0.42, ease: 'power3.out', immediateRender: false },
      );
  }

  /** Phone, during a drag: the copy leans with the finger. */
  lean(px: number): void {
    gsap.set(this.el, { x: px * 0.35, opacity: Math.max(0.35, 1 - Math.abs(px) / 260) });
  }

  unlean(): void {
    gsap.to(this.el, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' });
  }

  show(): gsap.core.Timeline {
    this.el.hidden = false;
    const items = [this.eyebrow, this.title, this.body];
    return gsap
      .timeline()
      .set(this.el, { opacity: 1 })
      .fromTo(
        items,
        { opacity: 0, y: 18, filter: 'blur(6px)' },
        {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.7,
          ease: 'power3.out',
          stagger: 0.07,
        },
      );
  }

  /** Phone: the headline stays put for its flight back; the rest fades. */
  hideRest(): gsap.core.Timeline {
    return gsap.timeline().to([this.eyebrow, this.body], { opacity: 0, y: 8, duration: 0.26, ease: 'power2.in' });
  }

  hide(): gsap.core.Timeline {
    return gsap.timeline().to(this.el, {
      opacity: 0,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        this.el.hidden = true;
      },
    });
  }
}
