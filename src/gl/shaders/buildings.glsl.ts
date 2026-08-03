import { COMMON, FRAG_OUT } from './common.glsl';

/**
 * The planet, built of buildings.
 *
 * Each instance is a unit box. The vertex shader stands it up on the sphere:
 * it builds a tangent basis at the footprint, scales the box to the tower's
 * footprint and height, spins it about its own normal, and lifts it so it sits
 * *on* the surface rather than through it.
 *
 * The whole real-estate reading of the site comes out of one dot product:
 * `dot(normal, sunDir)`. On the lit side the towers are cool grey-blue and
 * nearly invisible. On the night side they glow from inside, windows and all.
 */
export const BUILDING_VERT = /* glsl */ `
${COMMON}

uniform float uSpin;
uniform float uScale;      // global height multiplier
uniform float uReveal;     // grows the towers out of the surface

attribute vec3  aPos;      // footprint on the unit sphere
attribute vec4  aMeta;     // height, halfWidth, yaw, seed

varying vec3  vNormalW;    // outward surface normal, world space
varying vec3  vLocal;      // position inside the box, for the window grid
varying float vSeed;
varying float vHeight;
varying float vFace;       // 1 on the roof, 0 on the walls
varying float vFacing;     // 1 head-on, 0 at the limb

void main() {
  vec3 up = normalize(rotateY(aPos, uSpin));

  // Tangent basis. The helper only has to be non-parallel to the normal.
  vec3 helper = abs(up.y) < 0.92 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
  vec3 t = normalize(cross(helper, up));
  vec3 b = cross(up, t);

  // Spin the footprint so the blocks are not all aligned to the same grid.
  float c = cos(aMeta.z);
  float s = sin(aMeta.z);
  vec3 x = t * c + b * s;
  vec3 z = -t * s + b * c;

  float h = aMeta.x * uScale * uReveal;
  float w = aMeta.y;

  // The box was translated so its underside sits at y = 0, which means the
  // tower grows upwards out of the ground instead of being centred on it.
  vec3 world = up * (1.0 + position.y * h)
             + x * (position.x * w)
             + z * (position.z * w);

  vNormalW  = up;
  vLocal    = vec3(position.x, position.y, position.z);
  vSeed     = aMeta.w;
  vHeight   = aMeta.x;
  vFace     = position.y > 0.995 ? 1.0 : 0.0;

  vec4 mv = modelViewMatrix * vec4(world, 1.0);
  // At the limb the sight line grazes the surface and passes through hundreds
  // of towers. Without this the horizon burns to a white crescent.
  vec3 nView = normalize((modelViewMatrix * vec4(up, 0.0)).xyz);
  vFacing = clamp(dot(nView, normalize(-mv.xyz)), 0.0, 1.0);

  gl_Position = projectionMatrix * mv;
}
`;

export const BUILDING_FRAG = /* glsl */ `
precision highp float;
${FRAG_OUT}

uniform vec3  uSun;        // direction to the sun, world space
uniform vec3  uDayColor;
uniform vec3  uNightColor;
uniform vec3  uWindowColor;
uniform float uOpacity;
uniform float uWindowGain;

varying vec3  vNormalW;
varying vec3  vLocal;
varying float vSeed;
varying float vHeight;
varying float vFace;
varying float vFacing;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
  float lit = dot(normalize(vNormalW), normalize(uSun));

  // A soft terminator. Too sharp and the planet looks like a cut-out; too wide
  // and the night side never gets properly dark.
  float day   = smoothstep(-0.12, 0.30, lit);
  float night = 1.0 - day;

  // ---- windows ------------------------------------------------------------
  // A coarse grid over the facade. Most cells are lit, some are not, and the
  // pattern is stable per building because it is keyed off the instance seed.
  vec2 cell = vec2(
    floor((vLocal.x + vLocal.z) * 26.0 + vSeed * 40.0),
    floor(vLocal.y * 34.0 + vSeed * 12.0)
  );
  float on = step(0.34, hash(cell + vSeed * 97.0));
  // Roofs have no windows.
  on *= 1.0 - vFace;

  float glow = night * on * uWindowGain * (0.35 + vSeed * 0.65);

  // Taller towers read brighter — that is what makes a skyline legible.
  glow *= 0.55 + smoothstep(0.006, 0.05, vHeight) * 0.9;

  // The lit side stays deliberately faint. Sixty thousand additive boxes make
  // a very small number look like a lot, and the night side is the subject.
  vec3 col = uDayColor * day * 0.085 + uNightColor * night * 0.06 + uWindowColor * glow;

  float alpha = uOpacity * (0.045 + day * 0.09 + glow * 1.9);
  alpha *= mix(0.05, 1.0, pow(vFacing, 0.85));

  fragColor = vec4(col, clamp(alpha, 0.0, 1.0));
}
`;
