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
  icon: string;
}

/** Every icon is authored in this coordinate space. */
export const ICON_VIEWBOX = '0 0 48 48';

/*
 * Icons redrawn from assets-source/Webseite Langformat.jpeg at 48x48.
 *
 * The doubled coordinate space is the point: at 24 units a window grid or a
 * crane's lattice bracing collapses into a smear once the stroke is wide
 * enough to be visible. At 48 the fine detail survives all the way down to a
 * 27 px rail glyph.
 */

/*
 * Skyline, traced off the supplied artwork rather than invented.
 *
 * Eleven bars standing on a base rail, mirror-symmetric about the centre, in
 * four height steps: 2 + 2 low, 2 + 2 medium, 1 + 1 high, and the spire alone
 * in the middle.
 *
 * Pitch 3.0, bar weight 1.9. In the artwork a bar is half again as wide as the
 * gap beside it, and that ratio is the whole character of the mark — drawn
 * thinner it stops being a skyline and turns into a bar chart.
 *
 * Butt caps are deliberate and have to be set inline: the tops in the artwork
 * are flat, and base.css applies `stroke-linecap: round` to every svg, which a
 * presentation attribute on a child would lose to.
 */
const ICON_BUILDING = `
  <g style="stroke-linecap:butt" stroke-width="1.9">
    <path d="M9 42.5V28.3M12 42.5V28.3"/>
    <path d="M15 42.5V20.1M18 42.5V20.1"/>
    <path d="M21 42.5V10.2"/>
    <path d="M24 42.5V4"/>
    <path d="M27 42.5V10.2"/>
    <path d="M30 42.5V20.1M33 42.5V20.1"/>
    <path d="M36 42.5V28.3M39 42.5V28.3"/>
  </g>
  <path d="M5 43.6h38"/>`;

/*
 * Growth chart: three bars, a house with a stepped roof, and a zigzag arrow
 * rising over both, traced off the supplied artwork.
 *
 * The bars stop well clear of the house (gap at x 25.4–27) — the earlier
 * version let a third bar run under the roofline, which read as a second,
 * confused window instead of a house. There is exactly one aperture (the
 * door, bottom right), matching the reference.
 */
const ICON_CHART = `
  <path d="M4 43.5h40"/>
  <path d="M7 43.5V34.8h4.4v8.7"/>
  <path d="M14 43.5V28h4.4v15.5"/>
  <path d="M21 43.5V20.5h4.4v23"/>
  <path d="M27 29V43.5"/>
  <path d="M44 27.5V43.5"/>
  <path d="M27 29 33 19.5 37 24.5 40 22 44 27.5"/>
  <path d="M39.5 43.5v-5.5h3v5.5"/>
  <path d="M7 30 19 17.5 26 25 43 9"/>
  <path d="M35.8 11.6 43 9 41 16.2"/>`;

/*
 * Handshake, traced off the supplied artwork.
 *
 * Six elements, in the order they were measured: two sleeve cuffs as rotated
 * rectangles, one continuous wavy contour over both wrists, the left thumb
 * hooking down into the grip, the long diagonal that forms the back of the
 * right hand, that hand's fingers curling under it, and the left hand's four
 * fingers as stadium capsules stepping down to the left.
 *
 * The drawing is 1.43 : 1, so it is fitted to the frame's width and centred
 * vertically rather than stretched — a handshake squared up reads as a knot.
 */
const ICON_HANDSHAKE = `
  <path d="M9 8.7 14 12.2 6.9 24.6 2.1 21.1Z"/>
  <path d="M39 8.7 34 12.2l7.1 12.4 4.8-3.5Z"/>
  <path d="M14 12.2c.6 1 1.6 1.6 2.7 1.4 1.9-.3 3.6-2 5.4-2.5 1.2-.3 2.5-.3 3.7 0 1.8.5 3.5 2.2 5.4 2.5 1.1.2 2.1-.4 2.8-1.4"/>
  <path d="M15.3 13.4c.3 2.4-.3 5.1.6 6.9.9 1.7 3 1.4 4.4.2l2.9-3.2"/>
  <path d="m23.2 17.3 13.3 11.6a3 3 0 0 1-4 4.4L25 27.6"/>
  <path d="m28.9 29.9-5.4-4.7M26.1 32.9l-5.1-4.4M23.3 35.8l-4.4-3.8"/>
  <g stroke-width="1.6">
    <rect x="9" y="25.9" width="6" height="4" rx="2" transform="rotate(38 12 27.9)"/>
    <rect x="12" y="29.3" width="6" height="4" rx="2" transform="rotate(38 15 31.3)"/>
    <rect x="15.1" y="32.6" width="6" height="4" rx="2" transform="rotate(38 18.1 34.6)"/>
    <rect x="18.5" y="35.5" width="5.6" height="4" rx="2" transform="rotate(38 21.3 37.5)"/>
  </g>`;

/*
 * Tower crane, traced off the supplied artwork.
 *
 * Apex with three fanned support lines (short left, short vertical to the
 * mast, and the long forestay running the full length of the jib to its
 * tip); a trussed jib — parallel rails with a zigzag lattice, a distinct
 * counterweight box at the short end; a trussed mast with its own zigzag;
 * a footing on the ground line; and a hook assembly (cable, ring, sling
 * triangle, load block) hanging under the jib.
 */
const ICON_CRANE = `
  <path d="M7.5 43.5h19"/>
  <path d="M11 43.5V39.4h12v4.1"/>
  <path d="M14.2 39.4V17.6M19.6 39.4V17.6"/>
  <path d="M14.2 17.6 19.6 22 14.2 26.3 19.6 30.7 14.2 35 19.6 39.4"/>
  <path d="M6 17.6h37M6 13.2h37"/>
  <path d="M6 13.2v4.4M10.2 13.2v4.4M43 13.2v4.4"/>
  <path d="M10.2 13.2 14.3 17.6 18.4 13.2 22.5 17.6 26.6 13.2 30.7 17.6 34.8 13.2 38.9 17.6 43 13.2"/>
  <path d="M18 5 14.2 13.2M18 5 19.6 13.2M18 5 43 13.2"/>
  <path d="M36.5 17.6V22.2"/>
  <circle cx="36.5" cy="24" r="1.8"/>
  <path d="M36.5 25.8 30.6 31.3h11.8z"/>
  <path d="M30.6 31.3h11.8v6.3H30.6z"/>`;

/*
 * Statement with a folded corner and a coin over it, traced off the supplied
 * artwork. The coin sits further off the document's right edge than a first
 * pass had it (41 % of its diameter hangs past x=37, not 29 %) and rides
 * flush with the document's bottom edge — both measured off the reference.
 */
const ICON_ASSET = `
  <path d="M9 5.5h18.4L37 15.1v27.4H9z"/>
  <path d="M27.4 5.5v9.6H37"/>
  <path d="M14.5 21h17M14.5 26.2h17M14.5 31.4h11"/>
  <circle cx="35.5" cy="34.3" r="8.6"/>
  <path d="M35.5 28.2v12.2"/>
  <path d="M38.6 31.4a3 3 0 0 0-2.7-1.7h-1.2a2.4 2.4 0 0 0 0 4.8h1.8a2.4 2.4 0 0 1 0 4.8h-1.3a3 3 0 0 1-2.7-1.7"/>`;

/*
 * Speech bubble over two avatars, traced off the supplied artwork.
 *
 * The bubble is one continuous path with the tail cut into its own bottom
 * edge (attach points at x 16.3/19, apex at 17.6,26.8) rather than a
 * rounded rect plus a separate triangle — overlaying the two would leave a
 * stray straight-line artifact crossing the tail. The three dots are
 * filled, not stroked; they are the one place this icon set breaks from
 * outline-only, matching the reference exactly.
 */
const ICON_ADVISORY = `
  <path d="M13.7 4H31a2.5 2.5 0 0 1 2.5 2.5v12.2a2.5 2.5 0 0 1-2.5 2.5H19
           l-1.4 5.6-1.3-5.6h-2.6a2.5 2.5 0 0 1-2.5-2.5V6.5A2.5 2.5 0 0 1 13.7 4Z"/>
  <circle cx="17.9" cy="12.7" r="1.2" fill="#fff"/>
  <circle cx="23" cy="12.7" r="1.2" fill="#fff"/>
  <circle cx="28.1" cy="12.7" r="1.2" fill="#fff"/>
  <circle cx="9.15" cy="28.4" r="4.2"/>
  <path d="M4 44v-6.9a5.15 5.15 0 0 1 10.3 0V44Z"/>
  <circle cx="36.65" cy="28.4" r="4.2"/>
  <path d="M31.5 44v-6.9a5.15 5.15 0 0 1 10.3 0V44Z"/>`;

export const DIVISIONS: readonly Division[] = [
  {
    id: 'projectDevelopment',
    slug: 'project-development',
    accent: 'blue',
    angle: -32,
    dist: 2.1,
    lat: 50.1,
    lon: 8.7, // Frankfurt
    icon: ICON_BUILDING,
  },
  {
    id: 'realEstateInvestment',
    slug: 'real-estate-investment',
    accent: 'violet',
    angle: 40,
    dist: 2.2,
    lat: 40.7,
    lon: -74.0, // New York
    icon: ICON_CHART,
  },
  {
    id: 'transactionManagement',
    slug: 'transaction-management',
    accent: 'blue',
    angle: -90,
    dist: 2.45,
    lat: 51.5,
    lon: -0.13, // London
    icon: ICON_HANDSHAKE,
  },
  {
    id: 'constructionManagement',
    slug: 'construction-management',
    accent: 'violet',
    angle: 90,
    dist: 2.45,
    lat: 25.2,
    lon: 55.3, // Dubai
    icon: ICON_CRANE,
  },
  {
    id: 'assetManagement',
    slug: 'asset-management',
    accent: 'blue',
    angle: -142,
    dist: 2.35,
    lat: 47.4,
    lon: 8.5, // Zurich
    icon: ICON_ASSET,
  },
  {
    id: 'advisoryManagement',
    slug: 'advisory-management',
    accent: 'violet',
    angle: 142,
    dist: 2.35,
    lat: 1.35,
    lon: 103.8, // Singapore
    icon: ICON_ADVISORY,
  },
] as const;

export function divisionBySlug(slug: string): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}
