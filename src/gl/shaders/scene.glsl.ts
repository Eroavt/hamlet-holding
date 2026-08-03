import { COMMON, FRAG_OUT } from './common.glsl';

/* ------------------------------------------------------------------ stars */

export const STARS_VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uDpr;
uniform float uOpacity;

attribute float aSeed;
attribute float aScale;

varying float vAlpha;
varying float vWarm;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;

  // Slow, per-star twinkle. Never fully off — blinking stars read as a bug.
  float tw = 0.72 + 0.28 * sin(uTime * (0.35 + aSeed * 0.9) + aSeed * 43.0);

  gl_PointSize = clamp(aScale * uSize * uDpr / max(-mv.z, 0.001), 0.5, 7.0);
  vAlpha = uOpacity * tw * (0.25 + aScale * 0.75);
  vWarm = aSeed;
}
`;

export const STARS_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vAlpha;
varying float vWarm;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;
  float a = smoothstep(0.25, 0.0, d);
  vec3 col = mix(uColorA, uColorB, smoothstep(0.55, 1.0, vWarm));
  fragColor = vec4(col, a * a * vAlpha);
}
`;

/* ----------------------------------------------------------------- nebula */

export const NEBULA_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/**
 * Four-octave value noise on a single full-screen quad. Cheaper and softer
 * than throwing another fifty thousand particles at the background, and it
 * gives the deep navy clouds from the reference image.
 */
export const NEBULA_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}
${COMMON}

uniform float uTime;
uniform float uIntensity;
uniform float uAspect;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uAspect, 1.0);
  float r = length(uv);

  vec2 q = uv * 2.4;
  float drift = uTime * 0.012;
  float n = fbm(q + vec2(drift, drift * 0.6));
  float m = fbm(q * 1.9 - vec2(drift * 0.8, drift * 1.3) + n * 0.6);

  float cloud = smoothstep(0.32, 0.92, n * 0.65 + m * 0.55);

  vec3 col = mix(uColorA, uColorB, cloud);
  col = mix(col, uColorC, smoothstep(0.55, 1.0, m) * 0.7);

  // Hold the centre dark so the mark and the globe always sit on black.
  float core = smoothstep(0.05, 0.62, r);
  float edge = 1.0 - smoothstep(0.62, 1.15, r);

  fragColor = vec4(col * uIntensity * core * edge, 1.0);
}
`;

/* ------------------------------------------------------------------ lines */

export const LINES_VERT = /* glsl */ `
${COMMON}

uniform float uDraw;
uniform float uSpin;
uniform float uOpacity;
uniform float uScan;

attribute float aSeed;
attribute float aLand;

varying float vAlpha;
varying float vScan;

void main() {
  vec3 p = rotateY(position, uSpin);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float k = smoothstep(aSeed * 0.55, aSeed * 0.55 + 0.45, uDraw);

  // Fade the far hemisphere so the mesh reads as a volume, not a cage.
  vec3 nrm = normalize((modelViewMatrix * vec4(normalize(position), 0.0)).xyz);
  float facing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);

  vAlpha = uOpacity * k * mix(0.3, 1.0, aLand) * mix(0.22, 1.0, pow(facing, 0.6));

  // A band sweeping down the sphere — the single cheapest cue that says
  // "projection" rather than "object".
  vScan = 1.0 - smoothstep(0.0, 0.13, abs(p.y - uScan));
}
`;

export const LINES_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uColor;
uniform vec3 uScanColor;

varying float vAlpha;
varying float vScan;

void main() {
  vec3 col = mix(uColor, uScanColor, vScan * 0.85);
  fragColor = vec4(col, vAlpha * (1.0 + vScan * 1.6));
}
`;

/* ------------------------------------------------------------- core glow */

export const GLOW_VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  // Billboard: strip the rotation out of the model-view matrix.
  vec3 c = vec3(modelViewMatrix[3]);
  vec3 p = c + vec3(position.x * length(modelMatrix[0]), position.y * length(modelMatrix[1]), 0.0);
  gl_Position = projectionMatrix * vec4(p, 1.0);
}
`;

export const GLOW_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uColor;
uniform float uOpacity;

varying vec2 vUv;

void main() {
  float d = length(vUv - 0.5) * 2.0;
  float a = pow(clamp(1.0 - d, 0.0, 1.0), 2.6);
  fragColor = vec4(uColor, a * uOpacity);
}
`;

/* ------------------------------------------------------------ atmosphere */

export const ATMO_VERT = /* glsl */ `
varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalView = normalize(normalMatrix * normal);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

export const ATMO_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uColor;
uniform float uOpacity;
uniform float uPower;

varying vec3 vNormalView;
varying vec3 vViewDir;

void main() {
  float f = 1.0 - abs(dot(normalize(vNormalView), normalize(vViewDir)));
  f = pow(clamp(f, 0.0, 1.0), uPower);
  fragColor = vec4(uColor, f * uOpacity);
}
`;
