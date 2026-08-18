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
 * the shells ramp white → cyan → mid blue → deep blue on their own as the
 * wave passes through them — one family of blues end to end, no violet band.
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
uniform float uWord;       // 0 = the scene as built, 1 = settled into letters
uniform float uWordScale;  // half the frame width in world units
uniform float uWordBlast;  // how far the detonation throws, world units
uniform float uWordY;      // the camera's aim height, so the reveal is centred

attribute vec4  aMeta;   // x: shell, y: size, z: peak radius, w: random
attribute float aRole;   // 1 = globe, 0 = halo
attribute float aLand;
attribute vec4  aWord;   // xyz: normalised letter target, w: 1 = inside a glyph

varying float vRadius;
varying float vAlpha;
varying float vHeat;
varying float vWord;

/** Shell launch spread. Higher = more separated rings, slower total travel. */
const float SHELL_SPREAD = 0.55;

/*
 * The reveal's geometry, all as shares of half the visible frame width so the
 * composition holds at any viewport. uWordScale carries that half-width raw.
 */
/** Event horizon. Mirrored by the disc that paints it black — scenes/Void.ts. */
const float VOID_R   = 0.23;
/** Half-width of the line of text, and how far above the aim point it sits.
 *  Its own scale rather than the shared one: the vortex and the galaxy are
 *  sized to fill the frame, and the line is not. */
const float TEXT_FIT  = 0.40;
const float TEXT_LIFT = 0.17;
/** The galaxy left turning underneath it: wide, shallow, and sunk a little. */
const float GAL_RX = 0.80;
const float GAL_RY = 0.19;
const float GAL_RZ = 0.30;
const float GAL_Y  = -0.24;

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

  // ---- the vortex, the detonation, and the words it leaves behind ---------
  // Three stations on one parameter: the globe is drawn out into a turning
  // disc around an empty centre, that disc detonates, and the same particles
  // are gathered into the glyphs. The throw between them uses the bell curve
  // the collapse is built on — zero at both ends, maximal in the middle.
  float word = 0.0;
  float blast = 0.0;
  float swirlAmt = 0.0;
  float discA = 0.0;
  vec3 gCentreOut = vec3(0.0);
  float gRadius = 0.0;
  float gRing = 0.0;
  if (uWord > 0.0005) {
    float k = uWord;

    // -- the accretion disc ------------------------------------------------
    // The angle is hashed from the rest position rather than read off the
    // particle's direction. Taking it from the sphere inherits the sphere's
    // distribution, and that is the continents — which piled the disc up into
    // one bright lobe wherever there happened to be land.
    float a0 = fract(sin(dot(rest.xy + rest.z, vec2(12.9898, 78.233))) * 43758.5453) * TAU;
    // Radius from an independent random, so the two never correlate into a
    // single wound-up spiral. The exponent biases towards the rim without
    // starving the outer field, which has to reach the corners of the frame.
    float rr = pow(aMeta.w, 1.45);
    float vrad = uWordScale * (VOID_R + rr * 2.45);
    // Brightest hard against the horizon and thinning outwards, which is the
    // whole shape of the reference. Set here rather than added to the globe's
    // exposure: the disc covers many times the sphere's area, so the density
    // per pixel collapses and anything inherited from it reads as dust.
    discA = 0.44 - 0.19 * rr;

    // Differential rotation: the inner edge runs away from the outer one, and
    // that shear is the entire reason it reads as a vortex rather than a ring.
    float ang = a0 + uTime * 0.62 / (0.22 + rr * 1.9);
    // Centred on where the camera actually looks, not on the world origin. The
    // globe is deliberately lifted clear of the chrome below it, so anything
    // built around the origin inherits that lift and sits high in the frame.
    vec3 vortex = vec3(cos(ang) * vrad, sin(ang) * vrad * 0.94 + uWordY, (aMeta.z - 1.0) * 0.5);

    // -- what it settles into ----------------------------------------------
    // Two populations, split by the flag baked into the word buffer: the
    // glyphs get the line of text, everything else becomes the galaxy left
    // turning under it. One target expression, no second pass.
    vec3 letters = aWord.xyz * (uWordScale * TEXT_FIT)
                 + vec3(0.0, uWordY + uWordScale * TEXT_LIFT, 0.0);

    // Concentrated hard at the centre — that density *is* the blown-out core.
    float gr = pow(aMeta.w, 0.55);
    // Two narrow bands snapped onto fixed radii read as orbital rings.
    float ringA = smoothstep(0.80, 0.83, aMeta.w) * (1.0 - smoothstep(0.86, 0.89, aMeta.w));
    float ringB = smoothstep(0.92, 0.94, aMeta.w) * (1.0 - smoothstep(0.97, 0.99, aMeta.w));
    gr = mix(gr, 0.95, ringA);
    gr = mix(gr, 1.24, ringB);
    gRing = max(ringA, ringB);
    // One tilted circle: the same sine drives the vertical squash and the
    // depth, which is what makes it a disc lying in space rather than an
    // ellipse drawn on the glass.
    // A lens, not a sheet: the vertical extent swells towards the middle, so
    // the core reads as a bulge with the disc running out of it. A constant
    // squash gives a flat ellipse and nothing to look at.
    float ry = GAL_RY * (1.0 + 1.9 * exp(-gr * 4.5));
    float ga = a0 + uTime * 0.3 / (0.25 + gr * 1.4);
    vec3 gCentre = vec3(0.0, uWordY + uWordScale * GAL_Y, 0.0);
    vec3 galaxy = gCentre + vec3(
      cos(ga) * gr * uWordScale * GAL_RX,
      sin(ga) * gr * uWordScale * ry,
      sin(ga) * gr * uWordScale * GAL_RZ
    );

    gRadius = gr;
    vec3 rest2 = mix(galaxy, letters, aWord.w);

    // -- where the particle is heading -------------------------------------
    swirlAmt = smoothstep(0.0, 0.28, k) * (1.0 - smoothstep(0.30, 0.62, k));
    vec3 seat = mix(p, vortex, smoothstep(0.0, 0.28, k));
    // The letters land staggered across the line rather than all at once, so
    // the sentence writes itself in from the left instead of appearing whole.
    // Only the glyphs are delayed — the galaxy settles evenly.
    // The offset and the ramp have to end exactly on 1: at a wider stagger the
    // last letters' ramp runs past the end of the sweep and they never arrive.
    float lead = (aWord.x * 0.5 + 0.5) * 0.13 * aWord.w;
    seat = mix(seat, rest2, smoothstep(0.55 + lead, 0.87 + lead, k));
    gCentreOut = gCentre;

    // The blast lives between the two stations, not across the whole sweep.
    float b = clamp((k - 0.30) / 0.46, 0.0, 1.0);
    blast = pow(max(sin(b * PI), 0.0), 0.8);

    // Thrown along the particle's own direction off the origin rather than
    // away from wherever it currently sits: near the centre the latter is
    // numerically unstable and sprays in arbitrary directions.
    p = seat + spunDir * blast * uWordBlast * (0.55 + aMeta.w * 0.9);
    // Filaments. A clean disc looks machined; the curl is what gives the
    // streaked, cloth-like arms the reference has.
    p += curl(seat * 0.19 + vec3(uTime * 0.03)) * (blast * 1.15 + swirlAmt * 0.55);

    // Nothing may drift into the hole — a void with stars in it is not a void.
    float hole = uWordScale * VOID_R;
    vec2 rel = p.xy - vec2(0.0, uWordY);
    float pr = length(rel);
    if (swirlAmt > 0.001 && pr < hole) {
      p.xy = vec2(0.0, uWordY) + rel * mix(1.0, hole / max(pr, 1e-3), swirlAmt);
    }

    word = smoothstep(0.30, 0.72, k);
    vHeat = max(vHeat, blast);
  }

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  float dist = max(-mv.z, 0.001);
  gl_PointSize = clamp(aMeta.y * uSize * uDpr / dist, 0.6, 7.0);
  // Finer points once the letters have formed, or the strokes silt up.
  gl_PointSize *= mix(1.0, mix(0.6, 0.46, aWord.w), word * smoothstep(0.55, 1.0, uWord));

  // Colour is keyed to distance from the centre of whatever the particle now
  // belongs to. Measuring the galaxy from the world origin would run the ramp
  // across it lopsidedly, since it hangs below the aim point.
  vRadius = mix(length(p), distance(p, gCentreOut), word * (1.0 - aWord.w));

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
  // That term describes a sphere seen edge-on. Once the particles have left
  // the globe for the disc it no longer means anything, and left in it carves
  // an arbitrary dark half out of the vortex.
  limb = mix(limb, 1.0, max(swirlAmt, blast));
  vAlpha *= limb;
  // The disc is spread over far more of the frame than the globe was, so it
  // needs its own exposure or the rim goes flat.
  vAlpha = mix(vAlpha, uOpacity * discA, swirlAmt);

  // The letters have to carry themselves. The limb term above and the low
  // globe exposure both belong to a sphere, so once the words take over the
  // alpha is driven from the target instead: bright inside a glyph, faint in
  // the sky around it.
  if (uWord > 0.0005) {
    // Low by an order of magnitude against the sphere's exposure, and it has
    // to be: the glyph strokes are a fraction of the globe's area and every
    // one of a quarter of a million additive sprites lands inside them. At
    // anything higher the letters saturate into solid slabs and the whole
    // point — that they are made of stars — is lost.
    // The galaxy's brightness falls off from its core; the glyphs are even.
    float galA = 0.045 + 0.26 * pow(max(1.0 - gRadius, 0.0), 1.6) + gRing * 0.20;
    float lit = mix(galA, 0.082, aWord.w);
    vAlpha = mix(vAlpha, uOpacity * lit, word);
    // …and the detonation itself is not the letters' exposure. Without this
    // the blast inherits the settled value and the loudest moment of the whole
    // sequence renders as a dim drift of dust.
    vAlpha += uOpacity * blast * 0.42;
  }
  // Only the glyphs get the flat colour. The galaxy wants the radial ramp —
  // white-hot core through cyan to deep blue — which is exactly the reference.
  vWord = word * aWord.w;
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
varying float vWord;

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

  // The ramp above is keyed to distance from the centre, which is right for a
  // sphere and wrong for a line of text: it would light the middle words white
  // and sink the outer ones into the deep blue at the end of the ramp. Once
  // the letters take over the colour goes flat.
  col = mix(col, uCoreColor, vWord);

  col = mix(col, vec3(1.0), vHeat * mix(0.45, 0.85, vWord));

  fragColor = vec4(col, a * vAlpha);
}
`;
