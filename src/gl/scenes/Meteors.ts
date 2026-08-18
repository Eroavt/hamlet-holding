import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  GLSL3,
  Mesh,
  ShaderMaterial,
} from 'three';
import { METEOR_VERT, METEOR_FRAG } from '../shaders/meteor.glsl';

/**
 * Shooting stars across the opening sky.
 *
 * A fixed pool of streaks, each a camera-facing ribbon whose whole life is
 * computed in the vertex shader from elapsed time. See meteor.glsl.ts for the
 * timing; this class only lays out where they start and which way they go.
 */
/**
 * One streak, described by where it is *in the frame at mid-flight* rather
 * than by where it starts.
 *
 * The first version scattered origins at random and the result was a lottery:
 * one load put five streaks on screen at once, the next had them clipping a
 * corner for a fifth of a second. A hero that is sometimes spectacular and
 * sometimes empty is not a design, so the composition is fixed and verified.
 *
 * `tx`/`ty` are normalised device coordinates (-1 … 1, centre 0), `depth` is
 * distance from the camera in world units — chosen well behind the globe so a
 * streak always passes behind it — and `lean` is the horizontal drift per unit
 * of fall. `seed` sets both the speed and the phase; all four are above the
 * end of the visible window so the sky starts empty and the first streak
 * arrives a beat later.
 */
interface Placement {
  depth: number;
  tx: number;
  ty: number;
  lean: number;
  seed: number;
}

const PLACEMENTS: readonly Placement[] = [
  { depth: 24, tx: 0.16, ty: -0.04, lean: -0.88, seed: 0.92 },
  { depth: 33, tx: -0.46, ty: 0.40, lean: -0.6, seed: 0.74 },
  { depth: 28, tx: 0.44, ty: 0.28, lean: 0.56, seed: 0.55 },
];

/**
 * Travel fraction at which a streak sits on its placement target. Slightly
 * before halfway, so it crosses the point it was composed around while still
 * at full brightness rather than while fading out.
 */
const ANCHOR = 0.4;

export class Meteors {
  readonly mesh: Mesh;
  private material: ShaderMaterial;
  private origin: BufferAttribute;
  private dir: BufferAttribute;

  constructor() {
    const count = PLACEMENTS.length;
    const geo = new BufferGeometry();
    const verts = count * 4;
    const position = new Float32Array(verts * 3);
    const origin = new Float32Array(verts * 3);
    const dir = new Float32Array(verts * 3);
    const tail = new Float32Array(verts);
    const side = new Float32Array(verts);
    const seed = new Float32Array(verts);
    const index = new Uint16Array(count * 6);

    // head-left, head-right, tail-left, tail-right
    const TAIL = [0, 0, 1, 1];
    const SIDE = [-1, 1, -1, 1];

    for (let i = 0; i < count; i++) {
      for (let v = 0; v < 4; v++) {
        const j = i * 4 + v;
        tail[j] = TAIL[v];
        side[j] = SIDE[v];
        seed[j] = PLACEMENTS[i].seed;
      }
      const b = i * 4;
      index.set([b, b + 1, b + 2, b + 2, b + 1, b + 3], i * 6);
    }

    this.origin = new BufferAttribute(origin, 3);
    this.dir = new BufferAttribute(dir, 3);
    geo.setAttribute('position', new BufferAttribute(position, 3));
    geo.setAttribute('aOrigin', this.origin);
    geo.setAttribute('aDir', this.dir);
    geo.setAttribute('aTail', new BufferAttribute(tail, 1));
    geo.setAttribute('aSide', new BufferAttribute(side, 1));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geo.setIndex(new BufferAttribute(index, 1));

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: METEOR_VERT,
      fragmentShader: METEOR_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uSpan: { value: 46 },
        uPeriod: { value: 58 },
        uWidth: { value: 0.023 },
        uColor: { value: new Color(0xdcefff) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      // The ribbon's winding depends on which way the streak happens to run
      // across the view, so half of them would be back-facing and culled
      // outright. LineSegments had no such thing; a Mesh does.
      side: DoubleSide,
    });

    this.mesh = new Mesh(geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -4;
    this.mesh.visible = false;
  }

  /**
   * Turns each placement into a world-space origin and direction.
   *
   * Deliberately built from the camera's *resting* pose rather than its live
   * transform: the live one carries the pointer parallax and the collapse
   * dolly, so laying out against it would make the composition depend on where
   * the mouse happened to be. The camera never rolls and always looks down
   * −Z, which is what lets this stay closed-form instead of unprojecting.
   *
   * Cheap enough (sixteen vertices) to redo on every resize, which it has to
   * be — the viewing distance is derived from the viewport.
   */
  layout(camZ: number, lookY: number, aspect: number, fovDeg: number): void {
    const tanHalf = Math.tan((fovDeg * Math.PI) / 360);
    const span = this.material.uniforms.uSpan.value as number;
    const o = this.origin.array as Float32Array;
    const d = this.dir.array as Float32Array;
    const pos = this.mesh.geometry.getAttribute('position').array as Float32Array;

    for (let i = 0; i < PLACEMENTS.length; i++) {
      const p = PLACEMENTS[i];
      const halfH = p.depth * tanHalf;
      const halfW = halfH * aspect;

      // Down the screen with a sideways drift. Straight down would read as a
      // falling object rather than something entering the atmosphere.
      const len = Math.hypot(p.lean, 1);
      const dx = p.lean / len;
      const dy = -1 / len;

      // Wind back from the target so the streak arrives there in mid-flight.
      const ox = p.tx * halfW - dx * span * ANCHOR;
      const oy = lookY + p.ty * halfH - dy * span * ANCHOR;
      const oz = camZ - p.depth;

      for (let v = 0; v < 4; v++) {
        const k = (i * 4 + v) * 3;
        pos[k] = o[k] = ox;
        pos[k + 1] = o[k + 1] = oy;
        pos[k + 2] = o[k + 2] = oz;
        d[k] = dx;
        d[k + 1] = dy;
        d[k + 2] = 0;
      }
    }

    this.origin.needsUpdate = true;
    this.dir.needsUpdate = true;
    this.mesh.geometry.getAttribute('position').needsUpdate = true;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
    this.mesh.visible = v > 0.001;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  update(_dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
