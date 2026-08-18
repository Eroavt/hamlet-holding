import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  type Data3DTexture,
  GLSL3,
  Points,
  ShaderMaterial,
  Vector3,
} from 'three';
import { MORPH_VERT, MORPH_FRAG } from '../shaders/morph.glsl';
import type { BuildResult } from '../data/landmask.worker';

/**
 * The single particle system that *is* the website.
 *
 * It is created once and never rebuilt. "Universe", "globe" and "detail" are
 * not different scenes — they are different values of `progress` on this one
 * buffer. That is what makes the transition continuous, and it is also why
 * nothing can hitch mid-flight: no allocation, no upload, no shader compile
 * ever happens after boot.
 */
export class Morph {
  readonly points: Points;
  readonly material: ShaderMaterial;
  private geo = new BufferGeometry();
  private focus = new Vector3(0, 0, 1);
  private focusTarget = new Vector3(0, 0, 1);
  private focusAmt = 0;
  private focusAmtTarget = 0;

  constructor(curl: Data3DTexture) {
    this.material = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: MORPH_VERT,
      fragmentShader: MORPH_FRAG,
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uBurst: { value: 1.5 },
        uSize: { value: 15 },
        uDpr: { value: 1 },
        uSpin: { value: 0 },
        uOpacity: { value: 1 },
        uHaloOpacity: { value: 1 },
        uFocusAmt: { value: 0 },
        uFocus: { value: this.focus },
        uWord: { value: 0 },
        uWordScale: { value: 4 },
        uWordBlast: { value: 9 },
        uWordY: { value: 0 },
        uCurl: { value: curl },
        // The radial ramp lifted off the reference: white-hot core, cyan
        // shell, mid blue ring, deep blue outer cloud — kept to one family
        // of blues end to end, no violet band.
        uCoreColor: { value: new Color(0xd6f4ff) },
        uMidColor: { value: new Color(0x06c0fd) },
        uFarColor: { value: new Color(0x2f6fe0) },
        uEdgeColor: { value: new Color(0x14265f) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
    });

    this.points = new Points(this.geo, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 1;
    this.points.visible = false;
  }

  /**
   * Uploads the worker's result. There is no separate "start" buffer any
   * more: every particle begins at radius zero, so before the click there is
   * literally nothing on screen.
   */
  setData(result: BuildResult, count: number, word: Float32Array): void {
    this.geo.setAttribute('position', new BufferAttribute(result.positions, 3));
    this.geo.setAttribute('aMeta', new BufferAttribute(result.meta, 4));
    this.geo.setAttribute('aRole', new BufferAttribute(Float32Array.from(result.role), 1));
    this.geo.setAttribute('aLand', new BufferAttribute(Float32Array.from(result.land), 1));
    this.geo.setAttribute('aWord', new BufferAttribute(word, 4));
    this.geo.setDrawRange(0, count);
    this.points.visible = true;
  }

  /** 0 = the scene as built, 1 = settled into the letters. */
  set word(v: number) {
    this.material.uniforms.uWord.value = v;
  }

  get word(): number {
    return this.material.uniforms.uWord.value as number;
  }

  /**
   * Half the frame width in world units, so the line always spans the same
   * share of the viewport. Set from the camera, not baked.
   */
  set wordScale(v: number) {
    this.material.uniforms.uWordScale.value = v;
  }

  /** The camera's aim height, so the reveal is centred in the frame. */
  set wordY(v: number) {
    this.material.uniforms.uWordY.value = v;
  }

  set haloOpacity(v: number) {
    this.material.uniforms.uHaloOpacity.value = v;
  }

  get haloOpacity(): number {
    return this.material.uniforms.uHaloOpacity.value as number;
  }

  set progress(v: number) {
    this.material.uniforms.uProgress.value = v;
  }

  get progress(): number {
    return this.material.uniforms.uProgress.value as number;
  }

  set burst(v: number) {
    this.material.uniforms.uBurst.value = v;
  }

  get burst(): number {
    return this.material.uniforms.uBurst.value as number;
  }

  set opacity(v: number) {
    this.material.uniforms.uOpacity.value = v;
  }

  get opacity(): number {
    return this.material.uniforms.uOpacity.value as number;
  }

  set dpr(v: number) {
    this.material.uniforms.uDpr.value = v;
  }

  set spin(v: number) {
    this.material.uniforms.uSpin.value = v;
  }

  get spin(): number {
    return this.material.uniforms.uSpin.value as number;
  }

  /** Aim the globe's response at a direction, or pass null to release. */
  setFocus(dir: Vector3 | null): void {
    if (dir) {
      this.focusTarget.copy(dir).normalize();
      this.focusAmtTarget = 1;
    } else {
      this.focusAmtTarget = 0;
    }
  }

  update(dt: number, elapsed: number): void {
    this.material.uniforms.uTime.value = elapsed;

    const k = 1 - Math.pow(0.001, dt * 3.5);
    this.focusAmt += (this.focusAmtTarget - this.focusAmt) * k;
    if (this.focusAmt > 0.001) this.focus.lerp(this.focusTarget, k);
    this.material.uniforms.uFocusAmt.value = this.focusAmt;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}
