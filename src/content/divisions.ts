// Only one accent left on purpose — the violet variant was retired. Kept as a
// named type (rather than inlining 'blue') so a second accent can come back
// later without touching every call site again.
export type Accent = 'blue';

export interface Division {
  /** Stable key into the i18n dictionaries. */
  id: string;
  /** URL segment. */
  slug: string;
  accent: Accent;
  /**
   * Placement around the globe. `angle` is degrees clockwise from twelve
   * o'clock, `dist` is a multiple of the globe's projected radius — so the
   * composition holds at any viewport.
   *
   * The six-point ring measured off assets-source/Webseite Langformat.jpeg no
   * longer applies once Advisory and Asset Management are gone. The four
   * remaining fields are hung as a pyramid under the logo: a narrow upper
   * pair, a distinctly wider lower pair, apex at the mark itself.
   *
   * The sides cannot be truly straight. A line from the logo through the
   * lower pair would pass the upper row about a hundred pixels off centre,
   * which is inside the globe — so the taper is as steep as the sphere
   * allows, and the widening does the work rather than the geometry.
   *
   * Twelve o'clock has to stay empty for the same reason it always did: the
   * logo flies to its resting place directly above the globe.
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
 * Three towers with raked roofs and a growth curve sweeping over them, traced
 * off the supplied IMMOBILIEN INVESTMENT artwork.
 *
 * This replaces an earlier bar-chart-plus-zigzag mark that was drawn before
 * the artwork arrived and shares nothing with it. The composition here is a
 * skyline, not a chart: both flanking towers rake towards the tall one in the
 * middle, and the "investment" reading comes from the curve, which is smooth
 * and exponential rather than a stepped trend line.
 *
 * The inner mullions are set in their own group at a much lighter weight.
 * That hierarchy is in the reference — drawn at the outline's weight they run
 * together into a solid block below about 40 px.
 */
const ICON_INVESTMENT = `
  <g style="stroke-linecap:butt">
    <path d="M11.9 42.6V23.4L17.7 18.9"/>
    <path d="M17.7 42.6V10.3L26.6 4.9V42.6"/>
    <path d="M28.8 42.6V16.6L33.3 19.1V42.6"/>
    <g stroke-width="1.15">
      <path d="M20.6 42.6V14.6"/>
      <path d="M22.9 42.6V21.4"/>
      <path d="M25.2 42.6V15.2"/>
      <path d="M30.2 42.6V21.2"/>
      <path d="M31.9 42.6V20.4"/>
    </g>
    <path d="M5.5 43.9h37"/>
  </g>
  <path d="M9.5 40.8c8-.6 15.6-2.9 20.6-7.6 4.9-4.6 9-11.2 13.1-21.4"/>
  <path d="m39.5 15.3 3.7-3.5.3 5.1"/>`;

/*
 * Two towers exchanging direction, traced off the supplied
 * TRANSAKTIONSMANAGEMENT artwork.
 *
 * This replaces a handshake that was drawn three times before the artwork
 * arrived and never read at glyph size. The transaction is stated by the
 * composition rather than by a metaphor: both roofs rake up towards the gap,
 * so the buildings face one another, and the two arrows run between them in
 * opposite directions. Each tower stands on its own ground rule — they are
 * separate holdings, not one site.
 */
const ICON_TRANSACTION = `
  <g style="stroke-linecap:butt">
    <path d="M7.7 41.8V12.9L19 6.2V41.8"/>
    <g stroke-width="1.15">
      <path d="M11 41.8V17.6"/>
      <path d="M13.3 41.8V22.1"/>
      <path d="M15.2 41.8V20.3"/>
    </g>
    <path d="M4.3 42.8h17.2"/>
    <path d="M31.3 41.8V22.9L41 27.6V41.8"/>
    <g stroke-width="1.15">
      <path d="M33.8 41.8V29.2"/>
      <path d="M35.6 41.8V32.1"/>
      <path d="M37.3 41.8V31.1"/>
    </g>
    <path d="M27.2 42.8h16.5"/>
    <path d="M22.1 19.2h6.7"/>
    <path d="M28.4 37.7h-6.9"/>
  </g>
  <path d="m26.5 16.9 2.4 2.3-2.4 2.4"/>
  <path d="m23.9 35.3-2.4 2.4 2.4 2.4"/>`;

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
/*
 * Tower crane, traced off the supplied artwork.
 *
 * The earlier version carried full lattice bracing on both mast and jib. That
 * detail is not in the reference and it closed up into a grey block below
 * about 40 px anyway — this draws the crane as clean outlines: a plain mast,
 * a jib with one slanted end, the apex with its tie lines, and the load.
 *
 * The reference's hook is deliberately left out. Drawn at true scale it is a
 * circle of radius 1.6, which at a 2.1 stroke fills into a solid dot and welds
 * itself to the block below. Cable, slings and load carry the same silhouette
 * without the mush.
 */
const ICON_CRANE = `
  <g style="stroke-linecap:butt">
    <path d="M4.4 10.5h39M4.4 13.5h39"/>
    <path d="M4.4 10.5v3"/>
    <path d="M8.8 10.5v3"/>
    <g stroke-width="1">
      <path d="M15.8 13.5 18.1 10.5 20.4 13.5 22.7 10.5 25 13.5 27.3 10.5 29.6 13.5
               31.9 10.5 34.2 13.5 36.5 10.5 38.8 13.5 41.1 10.5 43.4 13.5"/>
    </g>
    <path d="M12.1 9.4h5.8v4.1h-5.8z"/>
    <path d="M14.3 4.6 8.8 10.5M14.3 4.6l14 5.8"/>
    <path d="M12.1 13.5v26.6M17.9 13.5v26.6"/>
    <path d="M10.8 40.1h8.4v2.5h-8.4z"/>
    <path d="M7.1 42.6h33.6"/>
    <path d="M22.9 42.6V27.3H26.6V24.1H31V30.6H35V37.2H38.9V42.6"/>
    <path d="M26.6 42.6V27.3M31 42.6V30.6M35 42.6V37.2"/>
    <path d="M39.2 13.5v4.7"/>
    <path d="M38.2 18.2h2v1.9h-2z"/>
  </g>
  <path d="M39.2 20.1v1.4a1.75 1.75 0 1 1-2 1.7"/>`;

export const DIVISIONS: readonly Division[] = [
  {
    id: 'projectDevelopment',
    slug: 'project-development',
    accent: 'blue',
    angle: -62,
    dist: 2.71,
    lat: 50.1,
    lon: 8.7, // Frankfurt
    icon: ICON_BUILDING,
  },
  {
    id: 'realEstateInvestment',
    slug: 'real-estate-investment',
    accent: 'blue',
    angle: 62,
    dist: 2.71,
    lat: 40.7,
    lon: -74.0, // New York
    icon: ICON_INVESTMENT,
  },
  {
    id: 'transactionManagement',
    slug: 'transaction-management',
    accent: 'blue',
    angle: -107,
    dist: 3.73,
    lat: 51.5,
    lon: -0.13, // London
    icon: ICON_TRANSACTION,
  },
  {
    id: 'constructionManagement',
    slug: 'construction-management',
    accent: 'blue',
    angle: 107,
    dist: 3.73,
    lat: 25.2,
    lon: 55.3, // Dubai
    icon: ICON_CRANE,
  },
] as const;

export function divisionBySlug(slug: string): Division | undefined {
  return DIVISIONS.find((d) => d.slug === slug);
}
