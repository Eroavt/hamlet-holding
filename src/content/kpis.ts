/**
 * The figures shown on the overview screen.
 *
 * ⚠ TWO OF THESE THREE ARE STILL PLACEHOLDERS. `leaseVolume` and
 * `developedArea` were read off the Seyband Gruppe reference screenshot and
 * are that company's published figures, not Hamlet's — they must be replaced
 * with Hamlet Holding's own audited numbers before the site goes live.
 * `projectVolume` was supplied by the client and is Hamlet's own.
 * Only this file needs changing; formatting and layout adapt on their own.
 *
 * `value` is the raw number so it can be formatted per locale — German groups
 * with dots, English with commas, and hard-coding either would be wrong in the
 * other language.
 */
export interface Kpi {
  /** Key into the i18n `kpis` dictionary. */
  id: string;
  value: number;
  unit: string;
}

export const KPIS: readonly Kpi[] = [
  { id: 'leaseVolume', value: 104_370_400, unit: '€' },
  { id: 'developedArea', value: 235_300, unit: 'm²' },
  { id: 'projectVolume', value: 168_400_000, unit: '€' },
] as const;

/**
 * Thousands grouped with a dot in every language.
 *
 * Deliberately not locale-dependent: these are the company's own figures and
 * they should read identically wherever the site is opened. Formatting them
 * per locale would print 168,400,000 on the English page — the same number,
 * but a reader used to dots sees a decimal point and a much smaller sum.
 */
export function formatKpi(value: number): string {
  return new Intl.NumberFormat('de-DE').format(value);
}
