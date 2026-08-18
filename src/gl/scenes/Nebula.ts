import { Color, GLSL3, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { NEBULA_VERT, NEBULA_FRAG } from '../shaders/scene.glsl';

const DEPTH = 90;

/**
 * Deep-space clouds as a single full-screen quad parented to the camera.
 *
 * Doing this with particles would cost tens of thousands of extra points for
 * a softer, noisier result. A four-octave fbm costs one fragment pass and
 * gives the exact navy tones of the reference image.
 */
export class Nebula {
  readonly mesh: Mesh;
  private material: ShaderMaterial;

  constructor() {
    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: NEBULA_VERT,
      fragmentShader: NEBULA_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uAspect: { value: 1 },
        uColorA: { value: new Color(0x030826) },
        uColorB: { value: new Color(0x12246b) },
        // Was 0x2a1a63 — that hex sits past 240° of hue, i.e. on the violet
        // side of blue rather than on it. Same depth, shifted to a hue that
        // reads unambiguously blue.
        uColorC: { value: new Color(0x1c2f6b) },
      },
      depthWrite: false,
      depthTest: false,
    });

    this.mesh = new Mesh(new PlaneGeometry(1, 1), this.material);
    this.mesh.position.z = -DEPTH;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }

  set intensity(v: number) {
    this.material.uniforms.uIntensity.value = v;
  }

  get intensity(): number {
    return this.material.uniforms.uIntensity.value as number;
  }

  /** Sizes the quad to exactly cover the frustum at its parked depth. */
  fit(fovDeg: number, aspect: number): void {
    const h = 2 * DEPTH * Math.tan((fovDeg * Math.PI) / 360);
    this.mesh.scale.set(h * aspect * 1.05, h * 1.05, 1);
    this.material.uniforms.uAspect.value = aspect;
  }

  update(_dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
