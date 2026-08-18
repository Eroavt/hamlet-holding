import gsap from 'gsap';
import { KPIS, formatKpi } from '@/content/kpis';
import type { Dictionary } from '@/content/i18n';

/**
 * The figures band on the overview screen.
 *
 * Three columns divided by hairlines, each a caption over a rule over a large
 * number — the composition from the reference artwork. Grouping is dot-style
 * in every language; see formatKpi() for why that is not locale-dependent.
 */
const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Turns the standalone figure in the heading into a button.
 *
 * Matches the first run of digits rather than a literal "7": the heading is
 * translated, and the number is the one token that survives translation
 * unchanged. Written as a raw match so that if the period ever stops being
 * seven years, the trigger follows the copy without anyone remembering to
 * come back here.
 */
function markFigure(s: string): string {
  const m = /\d+/.exec(s);
  if (!m) return esc(s);
  return (
    esc(s.slice(0, m.index)) +
    `<button type="button" class="kpi-sig">${esc(m[0])}</button>` +
    esc(s.slice(m.index + m[0].length))
  );
}

export class Kpis {
  readonly el: HTMLElement;
  /** Fired when the figure in the heading is clicked. */
  onSignature: (() => void) | null = null;
  private heading: HTMLElement;
  private list: HTMLElement;
  private counters: gsap.core.Tween[] = [];
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#kpi')!;
    this.heading = root.querySelector<HTMLElement>('#kpi-heading')!;
    this.list = root.querySelector<HTMLElement>('#kpi-list')!;
    this.build();
  }

  private build(): void {
    const frag = document.createDocumentFragment();

    for (const k of KPIS) {
      const cell = document.createElement('div');
      cell.className = 'kpi';
      cell.dataset.id = k.id;

      const term = document.createElement('dt');
      term.className = 'kpi__label';

      const rule = document.createElement('span');
      rule.className = 'kpi__rule';
      rule.setAttribute('aria-hidden', 'true');

      const value = document.createElement('dd');
      value.className = 'kpi__value';
      value.innerHTML = '<span class="kpi__num"></span><span class="kpi__unit"></span>';

      cell.append(term, rule, value);
      frag.append(cell);
    }

    this.list.append(frag);
  }

  setCopy(d: Dictionary): void {
    this.heading.innerHTML = markFigure(d.kpiHeading);
    // Rebound on every language change. The old button is discarded with the
    // markup, so there is nothing left listening.
    this.heading
      .querySelector<HTMLButtonElement>('.kpi-sig')
      ?.addEventListener('click', () => this.onSignature?.());

    for (const k of KPIS) {
      const cell = this.list.querySelector<HTMLElement>(`.kpi[data-id="${k.id}"]`);
      if (!cell) continue;
      cell.querySelector('.kpi__label')!.textContent = d.kpis[k.id] ?? '';
      cell.querySelector('.kpi__num')!.textContent = formatKpi(k.value);
      cell.querySelector('.kpi__unit')!.textContent = k.unit;
    }
  }

  /**
   * Runs the figures up from zero.
   *
   * Each tween eases out, so the number decelerates into its final value
   * instead of stopping dead. The three are staggered a little — three
   * counters finishing on the same frame reads as a single flicker rather
   * than three separate facts.
   *
   * Tabular figures in the CSS are what make this bearable: without them every
   * frame would be a different width and the whole band would jitter.
   */
  countUp(): void {
    this.stopCounters();
    if (this.reduced) return;

    KPIS.forEach((k, i) => {
      const el = this.list.querySelector<HTMLElement>(`.kpi[data-id="${k.id}"] .kpi__num`);
      if (!el) return;

      const proxy = { v: 0 };
      this.counters.push(
        gsap.to(proxy, {
          v: k.value,
          duration: 3.6,
          delay: i * 0.2,
          // Gentler than power2: that curve spends most of its time already
          // near the target, which at this length reads as the count stalling.
          ease: 'power1.out',
          onUpdate: () => {
            el.textContent = formatKpi(Math.round(proxy.v));
          },
          onComplete: () => {
            // Land exactly on the source value — rounding mid-tween can leave
            // the last frame a digit short.
            el.textContent = formatKpi(k.value);
          },
        }),
      );
    });
  }

  /** Cancels any run in progress and restores the final figures. */
  private stopCounters(): void {
    for (const t of this.counters) t.kill();
    this.counters.length = 0;
    for (const k of KPIS) {
      const el = this.list.querySelector<HTMLElement>(`.kpi[data-id="${k.id}"] .kpi__num`);
      if (el) el.textContent = formatKpi(k.value);
    }
  }
}
