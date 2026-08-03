import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
  GLSL3,
} from 'three';
import { STARS_VERT, STARS_FRAG } from '../shaders/scene.glsl';

/**
 * The background universe. One draw call, three implicit depth layers created
 * by the radius distribution — near stars are larger and parallax more, which
 * is what sells the sense of volume when the camera drifts.
 */
export class Starfield {
  readonly points: Points;
  private material: ShaderMaterial;

  constructor(count: number) {
    const geo = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    const scale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Three bands: far dust, mid field, near bokeh.
      const band = Math.random();
      const r = band < 0.55 ? 90 + Math.random() * 90 : band < 0.88 ? 45 + Math.random() * 45 : 22 + Math.random() * 22;

      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = r * s * Math.cos(theta);
      pos[i * 3 + 1] = r * s * Math.sin(theta) * 0.8;
      pos[i * 3 + 2] = r * u;

      seed[i] = Math.random();
      scale[i] = band < 0.55 ? 0.18 + Math.random() * 0.22 : band < 0.88 ? 0.4 + Math.random() * 0.35 : 0.75 + Math.random() * 0.5;
    }

    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geo.setAttribute('aScale', new BufferAttribute(scale, 1));

    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: STARS_VERT,
      fragmentShader: STARS_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 135 },
        uDpr: { value: 1 },
        uOpacity: { value: 0 },
        uColorA: { value: new Color(0xdfefff) },
        uColorB: { value: new Color(0x6f9bff) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });

    this.points = new Points(geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = -5;
  }

  set dpr(v: number) {
    this.material.uniforms.uDpr.value = v;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  update(dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
    this.points.rotation.y += dt * 0.004;
    this.points.rotation.x += dt * 0.0015;
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
