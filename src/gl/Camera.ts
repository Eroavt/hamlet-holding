import { PerspectiveCamera, Vector2, Vector3 } from 'three';
import { DIVISIONS } from '@/content/divisions';

const FOV = 42;
/** Projected globe radius as a share of the constraining screen dimension. */
const GLOBE_FIT = 0.17;

export type Layout = 'ring' | 'grid';

/*
 * Whether the annotation ring is usable is not a question of viewport width.
 * It depends on the globe's *projected* radius, which is driven by width and
 * height together — an iPad in portrait and a phone in landscape both clear
 * any sensible width breakpoint and still leave the ring nowhere to live,
 * because the globe is constrained by the other axis.
 *
 * So the ring is not chosen, it is *solved for*: take the largest radial scale
 * at which every tile clears the sphere and stays inside the frame, and fall
 * back to the grid when no such scale exists.
 */

/** Conservative tile box: two lines of label over an 80 px glyph. */
const TILE_W = 150;
const TILE_H = 132;
/** Kept clear at the top for the mark and at the bottom for the footer. */
const EDGE_Y = 84;
const EDGE_X = 24;
/** A tile's inner corner must sit this many globe-radii out from the centre. */
const CLEARANCE = 1.12;
const MIN_SCALE = 0.7;

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
  /** Projected radius of the unit sphere, in CSS pixels. */
  globeRadiusPx = 150;
  /** Which tile layout the current viewport can actually support. */
  layout: Layout = 'ring';
  /** Radial multiplier the ring is drawn at (1 = the authored composition). */
  ringScale = 1;
  /** Vertical aim offset in world units — lifts the globe on narrow screens. */
  private lookY = 0;

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
  private static solveRing(R: number, width: number, height: number): number | null {
    const halfDiag = Math.hypot(TILE_W, TILE_H) / 2;
    const limitX = width / 2 - EDGE_X;
    const limitY = height / 2 - EDGE_Y;

    for (let s = 1; s >= MIN_SCALE - 1e-6; s -= 0.02) {
      let ok = true;
      for (const d of DIVISIONS) {
        const a = (d.angle * Math.PI) / 180;
        const dist = d.dist * s * R;
        // Pulling the ring in helps the frame but hurts the sphere clearance,
        // which is what makes this a search rather than a clamp.
        if (dist - halfDiag < R * CLEARANCE) {
          ok = false;
          break;
        }
        if (Math.abs(Math.sin(a)) * dist + TILE_W / 2 > limitX) {
          ok = false;
          break;
        }
        if (Math.abs(Math.cos(a)) * dist + TILE_H / 2 > limitY) {
          ok = false;
          break;
        }
      }
      if (ok) return Math.round(s * 100) / 100;
    }
    return null;
  }

  fit(width: number, height: number): void {
    this.cam.aspect = width / Math.max(height, 1);
    this.focal = height / 2 / Math.tan((FOV * Math.PI) / 360);

    // The ring wants 0.72 of the width kept clear for the tiles; the grid frees
    // the width but takes the lower part of the height.
    const ringR = GLOBE_FIT * Math.min(height, width * 0.72);
    const scale = Camera.solveRing(ringR, width, height);

    this.layout = scale === null ? 'grid' : 'ring';
    this.ringScale = scale ?? 1;

    const target =
      this.layout === 'ring' ? ringR : 0.21 * Math.min(height * 0.52, width * 0.95);

    this.distance = this.focal / Math.max(target, 1);
    this.globeRadiusPx = this.focal / this.distance;

    // Lift the globe out of the tile grid by aiming below it.
    this.lookY = this.layout === 'grid' ? -(0.11 * height) / this.globeRadiusPx : 0;

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
