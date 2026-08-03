import type { Lang } from '@/content/i18n';

export class LangSwitch {
  readonly el: HTMLElement;
  private buttons: HTMLButtonElement[];

  onChange: ((lang: Lang) => void) | null = null;

  constructor(root: ParentNode = document) {
    this.el = root.querySelector<HTMLElement>('#lang')!;
    this.buttons = Array.from(this.el.querySelectorAll<HTMLButtonElement>('.lang__btn'));

    for (const b of this.buttons) {
      b.addEventListener('click', () => {
        const lang = b.dataset.lang as Lang;
        this.setActive(lang);
        this.onChange?.(lang);
      });
    }
  }

  setActive(lang: Lang): void {
    for (const b of this.buttons) {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    }
  }
}
