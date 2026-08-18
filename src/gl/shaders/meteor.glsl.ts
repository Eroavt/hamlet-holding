import { COMMON, FRAG_OUT } from './common.glsl';

/**
 * Shooting stars.
 *
 * Each streak is one camera-facing ribbon: four vertices, two triangles.
 * Everything else — when it appears, how far it travels, how it fades — is
 * derived in the vertex shader from uTime and a per-streak seed. Nothing is
 * computed on the CPU and nothing is allocated per frame; the whole field is
 * one draw call that runs forever off a single uniform.
 *
 * A ribbon rather than a GL line because `lineWidth` is clamped to 1 on every
 * desktop WebGL implementation there is — on a 2x display that is half a CSS
 * pixel, which reads as a faint dashed scratch rather than a meteor. The
 * ribbon also allows the width to taper from head to tail and the edges to
 * fall off softly, which is what actually sells the streak.
 *
 * The cycle is deliberately long and the visible window short, so a streak
 * crosses, disappears, and only returns much later. Meteors that repeat on a
 * noticeable beat stop reading as chance.
 */
export const METEOR_VERT = /* glsl */ `
${COMMON}

uniform float uTime;
uniform float uSpan;      // how far a streak travels, world units
uniform float uPeriod;    // seconds between two appearances of one streak
uniform float uWidth;     // half-width of the ribbon at the head, world units

attribute vec3  aOrigin;
attribute vec3  aDir;
attribute float aTail;    // 0 = head, 1 = tail
attribute float aSide;    // -1 / +1 across the ribbon
attribute float aSeed;

varying float vShow;
varying float vT;
varying float vSide;

void main() {
  // Each streak runs on its own phase, so they never fire together.
  float speed = 0.75 + aSeed * 0.5;
  float t = fract((uTime * speed + aSeed * uPeriod) / uPeriod);

  // Alive for an eighth of the cycle: in fast, out slower. The window is a
  // fraction, so it and uPeriod set the two things independently — their
  // product is how long a crossing takes, uPeriod alone is how often one
  // happens. Widening the window to make a streak slower would also put one
  // on screen half the time; lengthening the period is what buys the silence
  // between them.
  float show = smoothstep(0.0, 0.017, t) * (1.0 - smoothstep(0.073, 0.13, t));

  // Travel is eased so the streak decelerates as it fades, which is how a real
  // meteor reads. The exponent is kept low: a sharper ease front-loads the
  // whole crossing into the first half-second and the streak reads as a blink
  // rather than something drifting across the sky.
  float travel = (1.0 - pow(1.0 - clamp(t / 0.13, 0.0, 1.0), 1.7)) * uSpan;

  // The tail lags behind the head along the direction of travel, and stretches
  // with the streak's brightness so it draws itself out on entry and pulls
  // back in as it dies.
  float tailLen = (1.5 + aSeed * 2.1) * show;

  // Both ends in view space, so the ribbon can be widened square to the line
  // of sight — a ribbon expanded in world space would edge-on and vanish.
  vec4 mvHead = modelViewMatrix * vec4(aOrigin + aDir * travel, 1.0);
  vec4 mvTail = modelViewMatrix * vec4(aOrigin + aDir * (travel - tailLen), 1.0);

  vec3 mv = mix(mvHead.xyz, mvTail.xyz, aTail);
  vec2 along = mvTail.xy - mvHead.xy;
  float len = length(along);
  vec2 perp = len > 1e-5 ? vec2(-along.y, along.x) / len : vec2(1.0, 0.0);

  // Widest at the head, drawn to a point at the tail.
  mv.xy += perp * aSide * uWidth * mix(1.0, 0.22, aTail) * show;

  gl_Position = projectionMatrix * vec4(mv, 1.0);

  vShow = show;
  vT = aTail;
  vSide = aSide;
}
`;

export const METEOR_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3  uColor;
uniform float uOpacity;

varying float vShow;
varying float vT;
varying float vSide;

void main() {
  // Soft across the width: a hard-edged ribbon reads as a drawn polygon, a
  // gaussian core reads as light. The falloff is tight so the lit part stays
  // a hair rather than a band — the ribbon's geometric width is only there to
  // give that hair somewhere to be anti-aliased.
  float across = exp(-vSide * vSide * 5.2);

  // Along the length, brightest at the head and falling away down the tail.
  // The bump at the front is kept small: a strong one blooms into a round
  // blob and the streak stops looking drawn with a fine point.
  float along = pow(1.0 - vT, 2.1) + 0.34 * exp(-vT * 18.0);

  fragColor = vec4(uColor, uOpacity * vShow * across * along);
}
`;
