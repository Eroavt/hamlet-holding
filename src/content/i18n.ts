import en from './en.json';
import de from './de.json';

export type Lang = 'en' | 'de';

export interface DivisionCopy {
  label: string;
  title: string;
  body: string;
}

export interface Dictionary {
  brand: string;
  enterLabel: string;
  backLabel: string;
  eyebrow: string;
  /** Legal entity name — never translated. */
  company: string;
  imprint: string;
  privacy: string;
  legalPending: string;
  /** Shown above the privacy notice when the reader is not on the German site. */
  legalGermanOnly: string;
  partnerLabel: string;
  divisions: Record<string, DivisionCopy>;
}

const DICTS: Record<Lang, Dictionary> = { en, de };

const STORAGE_KEY = 'hhg.lang';

export function detectLang(): Lang {
  // Reading storage throws outright where it is blocked (Safari with cookies
  // disabled, an embedded frame with third-party storage partitioned off).
  // Unguarded, that rejected App.start() and the whole site fell through to
  // the "needs WebGL 2" screen on a browser that was perfectly capable.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'de') return stored;
  } catch {
    /* fall through to the browser's own preference */
  }
  return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

export function rememberLang(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* private mode — the choice simply does not persist */
  }
}

export function dict(lang: Lang): Dictionary {
  return DICTS[lang];
}
