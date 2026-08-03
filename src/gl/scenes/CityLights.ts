import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  GLSL3,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { CITY_VERT, CITY_FRAG } from '../shaders/city.glsl';
import type { BuildResult } from '../data/landmask.worker';

/**
 * The lights of the metropolitan regions.
 *
 * The towers already glow on the night side, but at orbit distance a tower is
 * under a pixel — far too small to read as a city. This layer sits on top of
 * them at a scale that survives: bright point sprites concentrated by the same
 * urbanisation field, so the continents announce themselves as a pattern of
 * settlement.
 *
 * They stay faintly visible on the day side too. A city that vanishes at dawn
 * reads as a bug; a city that dims reads as daylight.
 */
export class CityLights {
  readonly points: Points;
  readonly material: ShaderMaterial;
  private geo = new BufferGeometry();

  constructor(sun: Vector3) {
    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: CITY_VERT,
      fragmentShader: CITY_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uSpin: { value: 0 },
        uDpr: { value: 1 },
        uSize: { value: 62 },
        uOpacity: { value: 0 },
        uSun: { value: sun },
        uWarm: { value: new Color(0xffc27a) },
        uCool: { value: new Color(0xbfe4ff) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
    });

    this.points = new Points(this.geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 2;
    this.points.visible = false;
  }

  setData(result: BuildResult): void {
    this.geo.setAttribute('position', new BufferAttribute(result.cPos, 3));
    this.geo.setAttribute('aMeta', new BufferAttribute(result.cMeta, 2));
    this.geo.setDrawRange(0, result.cMeta.length / 2);
    this.points.visible = this.opacity > 0.001;
  }

  set spin(v: number) {
    this.material.uniforms.uSpin.value = v;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
    // Same reasoning as Buildings: fully transparent additive points still cost
    // a pass, and any stray term in the shader would leak through.
    this.points.visible = v > 0.001;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  set dpr(v: number) {
    this.material.uniforms.uDpr.value = v;
  }

  update(_dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}
