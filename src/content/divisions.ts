export type Accent = 'blue' | 'violet';

export interface Division {
  /** Stable key into the i18n dictionaries. */
  id: string;
  /** URL segment. */
  slug: string;
  accent: Accent;
  /**
   * Placement around the globe, measured off assets-source/Webseite Langformat.jpeg.
   * `angle` is degrees clockwise from twelve o'clock, `dist` is a multiple of
   * the globe's projected radius — so the composition holds at any viewport.
   */
  angle: number;
  dist: number;
  /** Where the hover light lands on the globe. */
  lat: number;
  lon: number;
}

/**
 * Every mark is authored in this coordinate space.
 *
 * 24 units because that is Lucide's grid — the marks are extracted from the
 * real package by scripts/build-icons.mjs rather than redrawn, so the whole
 * set shares one stroke weight, one corner radius and one optical size
 * without anyone having to keep them in agreement by hand.
 */
export const ICON_VIEWBOX = '0 0 24 24';

export const DIVISIONS: readonly Division[] = [
  {
    id: 'projectDevelopment',
    slug: 'project-development',
    accent: 'blue',
    angle: -32,
    dist: 2.1,
    lat: 50.1,
    lon: 8.7, // Frankfurt
  },
  {
    id: 'realEstateInvestment',
    slug: 'real-estate-investment',
    accent: 'violet',
    angle: 40,
    dist: 2.2,
    lat: 40.7,
    lon: -74.0, // New York
  },
  {
    id: 'transactionManagement',
    slug: 'transaction-management',
    accent: 'blue',
    angle: -90,
    dist: 2.45,
    lat: 51.5,
    lon: -0.13, // London
  },
  {
    id: 'constructionManagement',
    slug: 'construction-management',
    accent: 'violet',
    angle: 90,
    dist: 2.45,
    lat: 25.2,
    lon: 55.3, // Dubai
  },
  {
    id: 'assetManagement',
    slug: 'asset-management',
    accent: 'blue',
    angle: -142,
    dist: 2.35,
    lat: 47.4,
    lon: 8.5, // Zurich
  },
  {
    id: 'advisoryManagement',
    slug: 'advisory-management',
    accent: 'violet',
    angle: 142,
    dist: 2.35,
    lat: 1.35,
    lon: 103.8, // Singapore
  },
] as const;

export function divisionBySlug(slug: string): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}
