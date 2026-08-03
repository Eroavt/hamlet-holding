import { COMMON, FRAG_OUT } from './common.glsl';

export const CITY_VERT = /* glsl */ `
${COMMON}

uniform float uTime;
uniform float uSpin;
uniform float uDpr;
uniform float uSize;
uniform float uOpacity;
uniform vec3  uSun;

attribute vec2 aMeta;   // x: intensity 0..1, y: seed

varying float vAlpha;
varying float vWarm;

void main() {
  vec3 world = rotateY(position, uSpin);
  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  gl_Position = projectionMatrix * mv;

  float intensity = aMeta.x;
  float seed = aMeta.y;

  // Day and night. The lights never go out completely — a city that vanishes
  // at sunrise looks like a rendering fault, one that dims looks like daylight.
  float lit = dot(normalize(world), normalize(uSun));
  float night = 1.0 - smoothstep(-0.16, 0.34, lit);
  float lamp = mix(0.14, 1.0, night);

  // The terminator itself is where a city looks best, so lift it slightly.
  lamp += (1.0 - abs(lit)) * 0.18 * night;

  // Barely-there flicker, uncorrelated per point.
  lamp *= 0.9 + 0.1 * sin(uTime * (0.5 + seed * 1.4) + seed * 61.0);

  // The line of sight grazes the shell at the limb and stacks the lights up.
  vec3 nView = normalize((modelViewMatrix * vec4(world, 0.0)).xyz);
  float facing = clamp(dot(nView, normalize(-mv.xyz)), 0.0, 1.0);
  float limb = mix(0.1, 1.0, pow(facing, 0.75));

  float size = (0.42 + intensity * 0.85) * uSize * uDpr;
  gl_PointSize = clamp(size / max(-mv.z, 0.001), 0.7, 5.5);

  // Square-rooted rather than linear. Rejection sampling already piles points
  // into the biggest conurbations, so scaling brightness linearly on top of
  // that density stacks them into one white blob instead of a constellation.
  vAlpha = uOpacity * sqrt(intensity) * 0.5 * lamp * limb;
  // Big cities burn warm, small ones stay cool and pale.
  vWarm = smoothstep(0.25, 0.85, intensity);
}
`;

export const CITY_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3 uWarm;
uniform vec3 uCool;

varying float vAlpha;
varying float vWarm;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = dot(uv, uv);
  if (d > 0.25) discard;

  // A tight core with a wide, soft falloff — the shape of a light seen through
  // atmosphere, rather than a flat disc.
  float core = smoothstep(0.05, 0.0, d);
  float halo = smoothstep(0.25, 0.0, d);
  float a = core * 0.4 + halo * halo * 0.5;

  vec3 col = mix(uCool, uWarm, vWarm);
  col = mix(col, vec3(1.0), core * 0.32);

  fragColor = vec4(col, a * vAlpha);
}
`;
