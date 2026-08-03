import gsap from 'gsap';
import type { Dictionary } from '@/content/i18n';
import type { Block, LegalDoc } from '@/content/legal/types';
import { PRIVACY_DE } from '@/content/legal/privacy.de';
import { IMPRINT_DE } from '@/content/legal/imprint.de';

const DOCS: Record<LegalPage, LegalDoc> = {
  imprint: IMPRINT_DE,
  privacy: PRIVACY_DE,
};

export type LegalPage = 'imprint' | 'privacy';

/** The footer links carry real hrefs, so these paths have to resolve. */
const PATHS: Record<string, LegalPage> = {
  impressum: 'imprint',
  datenschutz: 'privacy',
};

/** The legal page the current URL asks for, if any. */
export function legalBySlug(path: string): LegalPage | undefined {
  return PATHS[path.slice(path.lastIndexOf('/') + 1)];
}

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Turns bare URLs into links without touching anything else in the text. */
const linkify = (s: string): string =>
  esc(s).replace(
    /(https?:\/\/[^\s,;)]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
  );

function renderBlock(b: Block): string {
  switch (b.t) {
    case 'lead':
      return `<p class="legal-lead">${linkify(b.text)}</p>`;
    case 'note':
      return `<p class="legal-note">${linkify(b.text)}</p>`;
    case 'h2':
      return `<h3>${esc(b.text)}</h3>`;
    case 'h3':
      return `<h4>${esc(b.text)}</h4>`;
    case 'h4':
      return `<h5>${esc(b.text)}</h5>`;
    case 'p':
      return `<p>${linkify(b.text)}</p>`;
    case 'small':
      return `<p class="legal-small">${linkify(b.text)}</p>`;
    case 'address':
      return `<p class="legal-address">${b.lines.map(linkify).join('<br>')}</p>`;
    case 'ul':
      return `<ul>${b.items.map((i) => `<li>${linkify(i)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol>${b.items
        .map(
          (i) =>
            `<li>${linkify(i.text)}${
              i.sub ? `<ul>${i.sub.map((s) => `<li>${linkify(s)}</li>`).join('')}</ul>` : ''
            }</li>`,
        )
        .join('')}</ol>`;
  }
}

function renderDoc(doc: LegalDoc): string {
  return doc.blocks.map(renderBlock).join('');
}

/**
 * Imprint and privacy notice.
 *
 * Both are legally required for a German company, and both are reachable from
 * the footer at every stage — but they are chrome, not part of the experience,
 * so they open as a flat overlay rather than disturbing the scene behind them.
 *
 * The bodies are placeholders until the real texts exist. Better an honest
 * "not written yet" than a link that goes nowhere.
 */
export class Legal {
  private el: HTMLElement;
  private title: HTMLElement;
  private body: HTMLElement;
  private close: HTMLButtonElement;
  private links: HTMLAnchorElement[];
  private copy!: Dictionary;

  onOpen: (() => void) | null = null;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#legal')!;
    this.title = root.querySelector<HTMLElement>('#legal-title')!;
    this.body = root.querySelector<HTMLElement>('#legal-body')!;
    this.close = root.querySelector<HTMLButtonElement>('#legal-close')!;
    this.links = Array.from(root.querySelectorAll<HTMLAnchorElement>('#footer-links a'));

    for (const a of this.links) {
      a.addEventListener('click', (e) => {
        // Keep the real href so the link is shareable and opens in a new tab
        // on middle click, but handle the ordinary click in place.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        this.open(a.dataset.legal as LegalPage);
      });
    }

    this.close.addEventListener('click', () => this.hide());
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.hide();
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.el.hidden) this.hide();
    });
  }

  setCopy(d: Dictionary): void {
    this.copy = d;
    this.links[0].textContent = d.imprint;
    this.links[1].textContent = d.privacy;
    this.close.setAttribute('aria-label', d.backLabel);
    if (!this.el.hidden) this.render(this.current);
  }

  private current: LegalPage = 'imprint';

  private render(page: LegalPage): void {
    this.current = page;
    this.title.textContent = page === 'imprint' ? this.copy.imprint : this.copy.privacy;

    // Only German versions exist, and both are binding legal texts —
    // machine-translating them would create a second, unreviewed version of a
    // document that has to be exact. English readers get the German original
    // with a note saying so.
    const prefix =
      this.copy.legalGermanOnly !== ''
        ? `<p class="legal-note">${this.copy.legalGermanOnly}</p>`
        : '';
    this.body.innerHTML = prefix + renderDoc(DOCS[page]);
    this.body.scrollTop = 0;
  }

  open(page: LegalPage): void {
    this.render(page);
    this.el.hidden = false;
    this.onOpen?.();
    gsap.fromTo(this.el, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    this.close.focus();
  }

  hide(): void {
    gsap.to(this.el, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.el.hidden = true;
      },
    });
  }
}
