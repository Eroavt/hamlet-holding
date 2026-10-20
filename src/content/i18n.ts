import en from './en.json';
import de from './de.json';
import ru from './ru.json';

/** Order here is the order the switcher renders in. */
export const LANGS = ['de', 'en', 'ru'] as const;
export type Lang = (typeof LANGS)[number];

export interface DivisionCopy {
  label: string;
  title: string;
  body: string;
}

export interface Dictionary {
  brand: string;
  enterLabel: string;
  backLabel: string;
  /** Short form of backLabel for the phone's back button. */
  overviewLabel: string;
  /** Touch-only invitation under the mark on the intro screen. */
  enterCue: string;
  eyebrow: string;
  /** Legal entity name — never translated. */
  company: string;
  imprint: string;
  privacy: string;
  legalPending: string;
  /** Shown above the privacy notice when the reader is not on the German site. */
  legalGermanOnly: string;
  partnerLabel: string;
  kpiHeading: string;
  /** Same heading with a hand-placed line break, for the phone. */
  kpiHeadingPhone: string;
  /** Keyed by the ids in content/kpis.ts. */
  kpis: Record<string, string>;
  /**
   * Captions broken by hand for three ~117 px phone columns. Set unbroken,
   * "Mietvertragsvolumen" runs out of its column.
   */
  kpisPhone: Record<string, string>;
  divisions: Record<string, DivisionCopy>;
}

const DICTS: Record<Lang, Dictionary> = { de, en, ru };

const STORAGE_KEY = 'hhg.lang';

function isLang(v: unknown): v is Lang {
  return typeof v === 'string' && (LANGS as readonly string[]).includes(v);
}

export function detectLang(): Lang {
  // Reading storage throws outright where it is blocked (Safari with cookies
  // disabled, a frame with partitioned storage). Unguarded, that rejected
  // App.start() and the site fell through to the "needs WebGL 2" screen on a
  // perfectly capable browser.
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLang(stored)) return stored;
  } catch {
    /* fall through to the browser's own preference */
  }
  const nav = navigator.language.toLowerCase();
  // German is the house language, so it is also the fallback.
  if (nav.startsWith('ru')) return 'ru';
  if (nav.startsWith('en')) return 'en';
  return 'de';
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
