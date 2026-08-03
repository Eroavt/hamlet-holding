import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  GLSL3,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  ShaderMaterial,
  Vector3,
} from 'three';
import { BUILDING_VERT, BUILDING_FRAG } from '../shaders/buildings.glsl';
import type { BuildResult } from '../data/landmask.worker';

/**
 * The built mass on the globe. One draw call.
 *
 * At orbit distance a tower is well under a pixel, so the globe still reads as
 * the abstract dotted hologram it was — the geometry only resolves as the
 * camera descends. That is the whole trick that keeps this away from the
 * "bar chart on a sphere" cliché every fintech site uses.
 */
export class Buildings {
  readonly mesh: Mesh;
  readonly material: ShaderMaterial;
  private geo: InstancedBufferGeometry;
  /** Shared with CityLights, so both layers agree on where the sun is. */
  readonly sun = new Vector3(1, 0.18, 0.35).normalize();
  private sunPhase = 0;

  constructor() {
    // A unit box whose origin sits on its underside, so scaling y grows the
    // tower upward out of the ground rather than through it.
    const box = new BoxGeometry(1, 1, 1);
    box.translate(0, 0.5, 0);

    this.geo = new InstancedBufferGeometry();
    this.geo.index = box.index;
    this.geo.setAttribute('position', box.getAttribute('position'));
    this.geo.instanceCount = 0;
    box.dispose();

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: BUILDING_VERT,
      fragmentShader: BUILDING_FRAG,
      uniforms: {
        uSpin: { value: 0 },
        uScale: { value: 1 },
        uReveal: { value: 0 },
        uOpacity: { value: 1 },
        uSun: { value: this.sun },
        // Kept low on purpose. The reference artwork is entirely cool, so the
        // amber has to read as an accent on the night side, never as the
        // subject. Drop this to 0 for the pure reference look.
        uWindowGain: { value: 0.5 },
        uDayColor: { value: new Color(0x7fb4dd) },
        uNightColor: { value: new Color(0x1b3f7a) },
        uWindowColor: { value: new Color(0xffb765) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
    });

    this.mesh = new Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 1;
    this.mesh.visible = false;
  }

  setData(result: BuildResult): void {
    const n = result.bMeta.length / 4;
    this.geo.setAttribute('aPos', new InstancedBufferAttribute(result.bPos, 3));
    this.geo.setAttribute('aMeta', new InstancedBufferAttribute(result.bMeta, 4));
    this.geo.instanceCount = n;
    this.mesh.visible = this.reveal > 0.001;
  }

  set spin(v: number) {
    this.material.uniforms.uSpin.value = v;
  }

  /** 0 → flat ground, 1 → full height. Driven by the collapse timeline. */
  set reveal(v: number) {
    this.material.uniforms.uReveal.value = v;
    // At zero height the boxes collapse to slivers, but they still paint their
    // night-side window glow — which shows up as a golden haze hanging in an
    // otherwise empty sky before the globe exists. Take them out entirely.
    this.mesh.visible = v > 0.001;
  }

  get reveal(): number {
    return this.material.uniforms.uReveal.value as number;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  /** Exaggerates height on approach, so a descent actually feels like one. */
  set scale(v: number) {
    this.material.uniforms.uScale.value = v;
  }

  get scale(): number {
    return this.material.uniforms.uScale.value as number;
  }

  update(dt: number): void {
    // A full day takes about three minutes. Slow enough to feel like a
    // condition rather than an animation, fast enough that the terminator has
    // visibly moved if you come back to the tab.
    this.sunPhase += dt * 0.035;
    this.sun.set(Math.cos(this.sunPhase), 0.18, Math.sin(this.sunPhase)).normalize();
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}
