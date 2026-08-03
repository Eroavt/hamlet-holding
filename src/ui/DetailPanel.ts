import gsap from 'gsap';
import type { Division } from '@/content/divisions';
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
  }

  fill(division: Division, d: Dictionary): void {
    const copy = d.divisions[division.id];
    this.eyebrow.textContent = d.eyebrow;
    this.title.textContent = copy.title;
    this.body.textContent = copy.body;
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
