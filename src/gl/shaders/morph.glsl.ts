import { COMMON, CURL, FRAG_OUT } from './common.glsl';

/**
 * The shockwave.
 *
 * Everything starts at radius zero — a singularity, nothing on screen. The
 * click detonates it. Three ideas do the work, and they are the difference
 * between a shockwave and a puff of smoke:
 *
 *   1. Each particle carries a shell index that delays its launch, so one
 *      blast leaves as a set of concentric rings rather than a single front.
 *   2. The radius is modulated by a function of *direction only*. The same
 *      direction always gets the same displacement, so the silhouette breaks
 *      into coherent lobes instead of noise. This is the structure the
 *      reference has and random turbulence can never produce.
 *   3. Two populations. The halo expands and stays out there for good; the
 *      globe particles overshoot far past their target and are then hauled
 *      back in. Expansion and condensation happen at the same time.
 *
 * Colour is a function of the current radius, not a per-particle constant, so
 * the shells ramp white → cyan → violet → deep blue on their own as the wave
 * passes through them.
 */
export const MORPH_VERT = /* glsl */ `
${COMMON}
${CURL}

uniform float uTime;
uniform float uProgress;
uniform float uBurst;
uniform float uSize;
uniform float uDpr;
uniform float uSpin;
uniform float uOpacity;
uniform float uHaloOpacity;
uniform float uFocusAmt;
uniform vec3  uFocus;

attribute vec4  aMeta;   // x: shell, y: size, z: peak radius, w: random
attribute float aRole;   // 1 = globe, 0 = halo
attribute float aLand;

varying float vRadius;
varying float vAlpha;
varying float vHeat;

/** Shell launch spread. Higher = more separated rings, slower total travel. */
const float SHELL_SPREAD = 0.55;

void main() {
  vec3 rest = position;
  float restR = length(rest);
  vec3 dir = restR > 1e-4 ? rest / restR : vec3(0.0, 1.0, 0.0);

  // The globe turns; the halo does not, so the two do not smear together.
  vec3 spunDir = mix(dir, rotateY(dir, uSpin), aRole);

  // ---- the wavefront ------------------------------------------------------
  float launch = aMeta.x * SHELL_SPREAD;
  float w = clamp((uProgress - launch) / max(1.0 - launch, 1e-3), 0.0, 1.0);
  // Decelerating: fast off the mark, coasting at the end.
  float wave = 1.0 - pow(1.0 - w, 2.6);

  float outPhase = smoothstep(0.0, 0.52, wave);
  float inPhase  = smoothstep(0.40, 1.0, wave);

  // ---- coherent lobing ----------------------------------------------------
  // Sampled by direction, so neighbours agree and the outline forms petals.
  float lobe = curl(spunDir * 0.42 + 0.5).x;
  float peak = aMeta.z * (1.0 + lobe * 0.44);

  float r = mix(peak * outPhase, restR, inPhase);

  // Spiral, don't spray. A purely radial launch reads as fireworks; winding
  // the direction back while the front is still travelling gives the curled,
  // cloth-like fronts the reference has. It unwinds to zero by the end, so
  // every particle still lands exactly on its target.
  float swirl = (1.0 - wave) * (0.55 + lobe * 0.9);
  vec3 flyDir = rotateY(spunDir, swirl);
  flyDir = normalize(mix(flyDir, spunDir, inPhase));

  vec3 p = flyDir * r;

  // ---- turbulence, strongest mid-flight -----------------------------------
  float bell = pow(max(sin(wave * PI), 0.0), 1.4);
  vHeat = bell;
  p += curl(p * 0.16 + vec3(uTime * 0.012)) * bell * uBurst * 0.55;

  // ---- the halo never settles completely ----------------------------------
  float alive = 1.0 - aRole;
  p += curl(p * 0.07 - vec3(uTime * 0.016)) * alive * inPhase * 0.34;

  // ---- hover: the globe answers the marker you are pointing at ------------
  if (uFocusAmt > 0.001) {
    float aim = max(dot(spunDir, uFocus), 0.0);
    p += spunDir * pow(aim, 8.0) * uFocusAmt * aRole * 0.09;
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float dist = max(-mv.z, 0.001);
  gl_PointSize = clamp(aMeta.y * uSize * uDpr / dist, 0.6, 7.0);

  vRadius = length(p);

  // ---- exposure -----------------------------------------------------------
  // Additive blending sums overlapping sprites; on the globe the land is
  // covered many times over, so per-particle alpha lives in the hundredths.
  float born = smoothstep(0.0, 0.05, w);
  // The towers carry the land now, so the point cloud steps back to being
  // atmosphere and surface shimmer rather than the map itself.
  float landBoost = mix(0.42, 1.0, aLand);
  float globeA = 0.2 * landBoost * smoothstep(0.28, 0.9, wave);
  float haloA  = 0.17 * uHaloOpacity * (0.4 + aMeta.w * 0.6);

  vAlpha = uOpacity * born * (mix(haloA, globeA, aRole) + bell * 0.075);

  // Limb attenuation: near the silhouette the sight line grazes the shell and
  // passes through far more particles, which otherwise burns the poles white.
  vec3 nrm = normalize((modelViewMatrix * vec4(spunDir, 0.0)).xyz);
  float facing = clamp(dot(nrm, normalize(-mv.xyz)), 0.0, 1.0);
  float limb = mix(1.0, mix(0.18, 1.0, pow(facing, 0.7)), aRole * inPhase);
  vAlpha *= limb;
}
`;

export const MORPH_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uCoreColor;
uniform vec3 uMidColor;
uniform vec3 uFarColor;
uniform vec3 uEdgeColor;

varying float vRadius;
varying float vAlpha;
varying float vHeat;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;

  float a = smoothstep(0.25, 0.0, d);
  a *= a;

  // Colour by where the particle currently is, not by a fixed per-particle
  // tint. As the wavefront sweeps outwards each shell moves through the ramp,
  // which is what produces the concentric colour rings.
  vec3 col = mix(uCoreColor, uMidColor, smoothstep(0.25, 0.95, vRadius));
  col = mix(col, uFarColor, smoothstep(1.5, 2.7, vRadius));
  col = mix(col, uEdgeColor, smoothstep(2.7, 4.4, vRadius));
  col = mix(col, vec3(1.0), vHeat * 0.45);

  fragColor = vec4(col, a * vAlpha);
}
`;
