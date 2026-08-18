import { LANGS, type Lang } from '@/content/i18n';

/** What each code is written as in the switcher. */
const LABEL: Record<Lang, string> = { de: 'DE', en: 'EN', ru: 'RU' };

export class LangSwitch {
  readonly el: HTMLElement;
  private buttons: HTMLButtonElement[] = [];

  onChange: ((lang: Lang) => void) | null = null;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#lang')!;
    this.build();
  }

  /**
   * Rendered from LANGS rather than written out in the markup: adding or
   * reordering a language then touches one array instead of three places that
   * have to agree.
   */
  private build(): void {
    const frag = document.createDocumentFragment();

    LANGS.forEach((lang, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.className = 'lang__sep';
        sep.setAttribute('aria-hidden', 'true');
        frag.append(sep);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lang__btn';
      btn.dataset.lang = lang;
      btn.textContent = LABEL[lang];
      btn.addEventListener('click', () => {
        this.setActive(lang);
        this.onChange?.(lang);
      });

      this.buttons.push(btn);
      frag.append(btn);
    });

    this.el.append(frag);
  }

  setActive(lang: Lang): void {
    for (const b of this.buttons) {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }
}
