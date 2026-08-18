import { Vector2, type Scene, type PerspectiveCamera, type WebGLRenderer } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** Vignette + radial chromatic aberration + film grain, in one pass. */
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null as unknown },
    uTime: { value: 0 },
    uVignette: { value: 0.62 },
    uGrain: { value: 0.028 },
    /*
     * Kept very low at rest.
     *
     * This is where the site's violet came from — nothing in the palette is
     * violet, but splitting the red and blue channels turns every bright star
     * near the frame edge into a red ghost and a blue ghost. Measured: 93
     * violet pixels at 0.0016, zero with the split off. Enough is left to
     * suggest a lens; the detonation still ramps it up for the flash.
     */
    uAberration: { value: 0.0004 },
    uBlueOnly: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;

    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uAberration;
    uniform float uBlueOnly;

    varying vec2 vUv;

    void main() {
      vec2 c = vUv - 0.5;
      float r2 = dot(c, c);

      // Aberration scales with distance from centre, so the middle stays clean.
      float ab = uAberration * r2 * 12.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + c * ab).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - c * ab).b;

      // The signature sequence is held to one family of blues. Clamping red
      // and green to the blue channel is a guarantee rather than a
      // correction: it does not matter what any layer upstream emits — a warm
      // window light still fading out, a stray tint in the bloom — nothing can
      // leave this pass red- or green-dominant. Neutral whites pass through
      // untouched, since there r = g = b already; a warm highlight just loses
      // its warmth and reads as light rather than as colour.
      if (uBlueOnly > 0.0) {
        vec3 cold = vec3(min(col.r, col.b), min(col.g, col.b), col.b);
        col = mix(col, cold, uBlueOnly);
      }

      col *= 1.0 - uVignette * smoothstep(0.22, 0.98, length(c) * 1.45);

      float g = fract(sin(dot(vUv + fract(uTime * 0.37), vec2(12.9898, 78.233))) * 43758.5453);
      col += (g - 0.5) * uGrain;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `,
};

export class Postprocessing {
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  readonly grade: ShaderPass;

  constructor(
    gl: WebGLRenderer,
    scene: Scene,
    camera: PerspectiveCamera,
    width: number,
    height: number,
    dpr: number,
  ) {
    this.composer = new EffectComposer(gl);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);

    this.composer.addPass(new RenderPass(scene, camera));

    // Half resolution. Bloom is a separable blur pyramid — halving each side
    // quarters the work, and a glow has no high frequencies to lose anyway.
    // Threshold well above black: only genuine highlights should glow,
    // otherwise the whole dark field lifts into a grey haze.
    this.bloom = new UnrealBloomPass(new Vector2(width * 0.5, height * 0.5), 0.55, 0.68, 0.22);
    this.composer.addPass(this.bloom);

    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);

    this.composer.addPass(new OutputPass());
  }

  set bloomStrength(v: number) {
    this.bloom.strength = v;
  }

  get bloomStrength(): number {
    return this.bloom.strength;
  }

  /** Holds the whole frame inside the blue family. Only the reveal uses it. */
  set blueOnly(v: number) {
    this.grade.uniforms.uBlueOnly.value = v;
  }

  get blueOnly(): number {
    return this.grade.uniforms.uBlueOnly.value as number;
  }

  set aberration(v: number) {
    this.grade.uniforms.uAberration.value = v;
  }

  get aberration(): number {
    return this.grade.uniforms.uAberration.value as number;
  }

  resize(width: number, height: number, dpr: number): void {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(width, height);
    this.bloom.setSize(width * 0.5, height * 0.5);
  }

  render(elapsed: number): void {
    this.grade.uniforms.uTime.value = elapsed;
    this.composer.render();
  }

  dispose(): void {
    this.composer.dispose();
  }
}
