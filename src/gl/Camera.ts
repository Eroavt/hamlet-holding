import { PerspectiveCamera, Vector2, Vector3 } from 'three';

const FOV = 42;
/** Projected globe radius as a share of the constraining screen dimension. */
const GLOBE_FIT = 0.17;
/** Must match the breakpoint where ui.css moves the tiles into a grid. */
const NARROW = 760;

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
  /** Vertical aim offset in world units — lifts the globe on narrow screens. */
  lookY = 0;
  /**
   * Height of the fixed chrome below the stage (key figures + footer), in CSS
   * pixels. The marker ring reaches 2.45 globe radii out, so sizing the globe
   * against the raw viewport height pushes the lower markers straight through
   * whatever sits at the bottom. Set by App from the measured elements.
   */
  bottomReserve = 0;

  private pointer = new Vector2();
  private smooth = new Vector2();
  private scratch = new Vector3();
  private focal = 1000;

  constructor() {
    this.cam = new PerspectiveCamera(FOV, 1, 0.1, 600);
    this.cam.position.set(0, 0, this.distance);
  }

  fit(width: number, height: number): void {
    this.cam.aspect = width / Math.max(height, 1);
    this.focal = height / 2 / Math.tan((FOV * Math.PI) / 360);

    // Wide: the tiles orbit the globe, so 0.72 of the width has to stay clear
    // for them. Narrow: they drop into a grid along the bottom instead, which
    // frees the width but takes the lower half of the height.
    const narrow = width <= NARROW;
    // Only the space the constellation can actually occupy counts.
    const usable = Math.max(height - this.bottomReserve, height * 0.45);
    const target = narrow
      ? 0.21 * Math.min(usable * 0.52, width * 0.95)
      : GLOBE_FIT * Math.min(usable, width * 0.72);

    this.distance = this.focal / Math.max(target, 1);
    this.globeRadiusPx = this.focal / this.distance;

    // Centre the globe in the space that is left, not in the window: aiming
    // below it by half the reserve lifts it clear of the bottom chrome.
    // The factors are under a half on purpose: lifting by the full half of the
    // reserve centred the globe in the free space above the chrome, which sat
    // it visibly high in the window. A little less lift drops it back towards
    // the middle of the frame without letting the markers reach the figures.
    const liftPx = narrow ? 0.11 * height + this.bottomReserve * 0.32 : this.bottomReserve * 0.37;
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
