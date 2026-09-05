import { PerspectiveCamera, Vector2, Vector3 } from 'three';
import { DIVISIONS } from '@/content/divisions';

const FOV = 42;
/** Projected globe radius as a share of the constraining screen dimension. */
const GLOBE_FIT = 0.17;

export type Layout = 'ring' | 'grid';

/*
 * Whether the marker ring is usable is not a question of viewport width.
 *
 * It depends on the globe's *projected* radius, which is driven by width and
 * height together — a tablet in portrait and a phone in landscape both clear
 * any sensible width breakpoint and still leave the ring nowhere to live,
 * because the globe is constrained by the other axis. A width breakpoint
 * cannot see that, which is why 844x390 ended up with every marker stacked on
 * the mark and two of them off the top of the screen.
 *
 * So the ring is not chosen, it is *solved for*: take the largest radial scale
 * at which every marker clears the sphere and stays inside the frame, and fall
 * back to the grid when no such scale exists.
 */

/** Measured marker box: two lines of label over the glyph. */
const TILE_W = 140;
const TILE_H = 140;
/** Fallback until App measures the real header. */
const HEADER_BAND = 104;
/** The globe never collapses below this, whatever the chrome leaves. */
const MIN_RADIUS = 18;
const EDGE_X = 16;
const EDGE_Y = 8;
/** Share of the bottom chrome the ring is lifted by; must match fit(). */
const RING_LIFT = 0.37;
/** A marker's inner corner must sit this many globe-radii out from the centre. */
const CLEARANCE = 1.12;
const MIN_SCALE = 0.62;

/**
 * The camera never looks anywhere but the origin. It only breathes: a damped
 * parallax offset from the pointer, plus a dolly the collapse timeline drives.
 *
 * Parallax is deliberately *not* 1:1 with the pointer — following the mouse
 * exactly is the single most common tell of an amateur WebGL scene.
 */
export class Camera {
  readonly cam: PerspectiveCamera;

  /** Distance that makes the globe land at GLOBE_FIT of the viewport. */
  distance = 7.6;
  /** Multiplier the collapse timeline animates (1 = resting). */
  dolly = 1;
  /**
   * Roll about the view axis, in radians. Zero everywhere except the signature
   * sequence — a horizon that tilts is the one camera move a static scene
   * cannot fake, and it is what makes being pulled into the vortex read as
   * motion rather than as a zoom.
   */
  roll = 0;
  /** Projected radius of the unit sphere, in CSS pixels. */
  globeRadiusPx = 150;
  /** Which marker layout this viewport can actually support. */
  layout: Layout = 'ring';
  /** Radial multiplier the ring is drawn at (1 = the authored composition). */
  ringScale = 1;
  /** Vertical aim offset in world units — lifts the globe on narrow screens. */
  lookY = 0;
  /**
   * Height of the fixed chrome below the stage (key figures + footer), in CSS
   * pixels. The marker ring reaches 2.45 globe radii out, so sizing the globe
   * against the raw viewport height pushes the lower markers straight through
   * whatever sits at the bottom. Set by App from the measured elements.
   */
  bottomReserve = 0;
  /**
   * Height of the marker grid, in CSS pixels, when the grid layout is in use.
   *
   * In grid mode the globe owns the band between the mark and the markers, so
   * sizing it against a fixed fraction of the window leaves it far smaller
   * than the room allows — 28 px radius in a 390 px landscape window, where
   * 55 px fits. Measured by App and zero while the ring is in use.
   */
  markerReserve = 0;
  /**
   * Measured height of the header band, in CSS pixels.
   *
   * The constant was 104, but the header compacts to 63 on a short window —
   * assuming the larger figure drove the available band negative and collapsed
   * the globe to a single pixel.
   */
  headerReserve = HEADER_BAND;

  private pointer = new Vector2();
  private smooth = new Vector2();
  private scratch = new Vector3();
  private focal = 1000;

  constructor() {
    this.cam = new PerspectiveCamera(FOV, 1, 0.1, 600);
    this.cam.position.set(0, 0, this.distance);
  }

  /**
   * Largest radial scale at which the whole ring clears the globe and stays in
   * frame, or null when the ring cannot be made to work at this size at all.
   */
  private static solveRing(
    R: number,
    width: number,
    height: number,
    bottomReserve: number,
  ): number | null {
    const halfDiag = Math.hypot(TILE_W, TILE_H) / 2;
    const limitX = width / 2 - EDGE_X;
    // Where the globe actually ends up: the ring is lifted clear of the bottom
    // chrome, so it is not centred on the window.
    const cy = height / 2 - bottomReserve * RING_LIFT;
    // The header is only *occupied* across the mark and the language switch,
    // and the side markers clear those horizontally — at 1440x900 they sit 27 px
    // above the header's box with no collision at all. So the top constraint is
    // simply staying on screen. The bottom is different: the figures band runs
    // the full width, so the markers genuinely have to stay above it.
    const topLimit = EDGE_Y;
    const bottomLimit = height - bottomReserve;

    for (let s = 1; s >= MIN_SCALE - 1e-6; s -= 0.02) {
      let ok = true;
      for (const d of DIVISIONS) {
        const a = (d.angle * Math.PI) / 180;
        const dist = d.dist * s * R;
        // Pulling the ring in helps the frame but hurts the sphere clearance,
        // which is what makes this a search rather than a clamp.
        if (dist - halfDiag < R * CLEARANCE) { ok = false; break; }
        if (Math.abs(Math.sin(a)) * dist + TILE_W / 2 > limitX) { ok = false; break; }
        const markerY = cy - Math.cos(a) * dist;
        if (markerY - TILE_H / 2 < topLimit) { ok = false; break; }
        if (markerY + TILE_H / 2 > bottomLimit) { ok = false; break; }
      }
      if (ok) return Math.round(s * 100) / 100;
    }
    return null;
  }

  fit(width: number, height: number): void {
    this.cam.aspect = width / Math.max(height, 1);
    this.focal = height / 2 / Math.tan((FOV * Math.PI) / 360);

    // Only the space the constellation can actually occupy counts.
    const usable = Math.max(height - this.bottomReserve, height * 0.45);
    const ringR = GLOBE_FIT * Math.min(usable, width * 0.72);
    const scale = Camera.solveRing(ringR, width, height, this.bottomReserve);

    this.layout = scale === null ? 'grid' : 'ring';
    this.ringScale = scale ?? 1;
    const narrow = this.layout === 'grid';

    // In grid mode the globe fills the band left between the mark above and
    // the markers below, rather than a fixed share of the window. On a very
    // short window that band collapses towards nothing, so the older
    // fraction-of-viewport figure is kept as a floor: the globe is whichever
    // of the two is larger, never smaller than it used to be.
    // A little air at each end so the sphere does not sit flush against the
    // mark above or the markers below.
    const band = height - this.headerReserve - this.markerReserve - this.bottomReserve - 20;
    const byBand = Math.min(0.42 * band, width * 0.3);
    const byShare = 0.21 * Math.min(usable * 0.52, width * 0.95);
    // The share figure is a floor, not a licence to overhang: capped at what
    // the band can actually hold, or the sphere grows back over the mark above
    // it and the markers below it on the smallest screens.
    const target = narrow
      ? Math.max(Math.min(Math.max(byBand, byShare), 0.46 * band), MIN_RADIUS)
      : ringR;

    this.distance = this.focal / Math.max(target, 1);
    this.globeRadiusPx = this.focal / this.distance;

    // Centre the globe in the space that is left, not in the window: aiming
    // below it by half the reserve lifts it clear of the bottom chrome.
    // The factors are under a half on purpose: lifting by the full half of the
    // reserve centred the globe in the free space above the chrome, which sat
    // it visibly high in the window. A little less lift drops it back towards
    // the middle of the frame without letting the markers reach the figures.
    // In grid mode the globe owns the band between the mark and the markers,
    // so it is centred in *that* band rather than lifted by a fraction of the
    // window. Sizing it to the band while centring it by a fraction is what
    // left it hanging 23 px over the first row of markers.
    const markersTop = height - this.bottomReserve - this.markerReserve;
    const liftPx = narrow
      ? height / 2 - (this.headerReserve + markersTop) / 2
      : this.bottomReserve * RING_LIFT;
    this.lookY = -liftPx / this.globeRadiusPx;

    this.cam.updateProjectionMatrix();
  }

  setPointer(nx: number, ny: number): void {
    this.pointer.set(nx, ny);
  }

  update(dt: number): void {
    // Frame-rate independent damping: the same visual response at 30 and 144 Hz.
    const k = 1 - Math.pow(0.001, dt * 2.6);
    this.smooth.lerp(this.pointer, k);

    const d = this.distance * this.dolly;
    this.cam.position.set(this.smooth.x * 0.42, this.smooth.y * 0.3 + this.lookY, d);
    this.cam.lookAt(0, this.lookY, 0);
    // After the aim, so it turns about the line of sight rather than tipping
    // the camera off its target.
    if (this.roll !== 0) this.cam.rotateZ(this.roll);

    // The renderer would do this too, but only later in the frame. Projecting
    // world points for the DOM layer needs a valid inverse *now*, and on the
    // first frame it does not exist at all — which yields NaN.
    this.cam.updateMatrixWorld(true);
    this.cam.matrixWorldInverse.copy(this.cam.matrixWorld).invert();

    this.globeRadiusPx = this.focal / d;
  }

  /** Screen-space position of a world point, in CSS pixels. */
  project(point: Vector3, width: number, height: number, out: { x: number; y: number }): void {
    this.scratch.copy(point).project(this.cam);
    out.x = (this.scratch.x * 0.5 + 0.5) * width;
    out.y = (-this.scratch.y * 0.5 + 0.5) * height;
  }
}
