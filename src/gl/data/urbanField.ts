/**
 * Where the built mass goes.
 *
 * The globe is not meant to be a map. Nobody should be able to trace a
 * coastline on it — it should read as Earth because the *lights* are where
 * people are. So building placement is driven by an urbanisation field rather
 * than by the land mask alone: a set of metropolitan attractors with distance
 * falloff, roughened with noise.
 *
 * Recognition then comes for free. You know it is North America because
 * there is a dense band along the eastern seaboard, not because a line has
 * been drawn around Florida.
 */

/** [lon, lat, weight] — weight drives both density and tower height. */
const METROS: readonly (readonly [number, number, number])[] = [
  // North America
  [-74.0, 40.7, 1.0], // New York
  [-87.6, 41.9, 0.72], // Chicago
  [-118.2, 34.05, 0.86], // Los Angeles
  [-122.4, 37.77, 0.7], // San Francisco
  [-95.4, 29.8, 0.6], // Houston
  [-80.2, 25.8, 0.58], // Miami
  [-79.4, 43.7, 0.66], // Toronto
  [-99.1, 19.4, 0.74], // Mexico City
  [-75.2, 40.0, 0.5], // Philadelphia
  [-71.1, 42.4, 0.52], // Boston
  // South America
  [-46.6, -23.5, 0.82], // São Paulo
  [-43.2, -22.9, 0.64], // Rio de Janeiro
  [-58.4, -34.6, 0.66], // Buenos Aires
  [-77.0, -12.0, 0.52], // Lima
  [-74.1, 4.7, 0.54], // Bogotá
  // Europe
  [-0.13, 51.5, 0.94], // London
  [2.35, 48.86, 0.82], // Paris
  [13.4, 52.52, 0.66], // Berlin
  [8.68, 50.11, 0.7], // Frankfurt
  [4.9, 52.37, 0.58], // Amsterdam
  [12.5, 41.9, 0.58], // Rome
  [-3.7, 40.4, 0.62], // Madrid
  [8.54, 47.37, 0.6], // Zurich
  [37.6, 55.75, 0.72], // Moscow
  [28.98, 41.01, 0.68], // Istanbul
  [18.07, 59.33, 0.44], // Stockholm
  // Middle East / Africa
  [55.27, 25.2, 0.9], // Dubai
  [51.53, 25.29, 0.56], // Doha
  [46.68, 24.71, 0.58], // Riyadh
  [31.24, 30.04, 0.66], // Cairo
  [3.38, 6.52, 0.6], // Lagos
  [28.05, -26.2, 0.56], // Johannesburg
  [36.82, -1.29, 0.44], // Nairobi
  // Asia
  [139.7, 35.68, 1.0], // Tokyo
  [126.98, 37.57, 0.84], // Seoul
  [121.47, 31.23, 0.96], // Shanghai
  [116.4, 39.9, 0.88], // Beijing
  [114.17, 22.32, 0.86], // Hong Kong
  [103.82, 1.35, 0.8], // Singapore
  [72.88, 19.08, 0.82], // Mumbai
  [77.21, 28.61, 0.76], // Delhi
  [100.5, 13.76, 0.62], // Bangkok
  [106.85, -6.21, 0.7], // Jakarta
  [121.0, 14.6, 0.6], // Manila
  [90.4, 23.8, 0.58], // Dhaka
  // Oceania
  [151.2, -33.87, 0.66], // Sydney
  [144.96, -37.81, 0.58], // Melbourne
];

const DEG = Math.PI / 180;


/** Cheap deterministic hash noise on the sphere, two octaves. */
function rough(lon: number, lat: number): number {
  const h = (a: number, b: number): number => {
    const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  return h(lon * 0.09, lat * 0.09) * 0.6 + h(lon * 0.31, lat * 0.31) * 0.4;
}

/**
 * Urbanisation at a point, 0..1.
 *
 * `extra` lets the caller fold in the company's own locations so the six
 * division anchors always sit on visible cities.
 */
/**
 * The attractor term alone: ~50 metros, each costing an arc plus two pow/exp.
 *
 * The list is flattened into one packed array first. Destructuring
 * `for (const [lon, lat, weight] of list)` allocates an iterator and a fresh
 * array per metro per call, which at fifty metros times thirty thousand cells
 * is a million and a half short-lived objects.
 */
function flatten(
  extra: readonly (readonly [number, number, number])[],
): Float64Array {
  const all = [...METROS, ...extra];
  // [ux, uy, uz, weight] per metro. Storing the unit vector turns the
  // great-circle distance into a dot product and one acos, instead of the
  // haversine's two sines, two cosines, a sqrt and an atan2.
  const f = new Float64Array(all.length * 4);
  for (let i = 0; i < all.length; i++) {
    const lon = all[i][0] * DEG;
    const lat = all[i][1] * DEG;
    const c = Math.cos(lat);
    f[i * 4] = c * Math.cos(lon);
    f[i * 4 + 1] = Math.sin(lat);
    f[i * 4 + 2] = c * Math.sin(lon);
    f[i * 4 + 3] = all[i][2];
  }
  return f;
}

/** Past this arc the strongest possible contribution is under 0.002. */
const FAR_DOT = Math.cos(1.15);

function metroTermFlat(
  ux: number,
  uy: number,
  uz: number,
  flat: Float64Array,
): number {
  let best = 0;
  for (let i = 0; i < flat.length; i += 4) {
    const dot = ux * flat[i] + uy * flat[i + 1] + uz * flat[i + 2];
    // Most metros are nowhere near any given cell; rejecting them on the dot
    // alone skips the acos and both pow/exp pairs.
    if (dot < FAR_DOT) continue;
    const d = Math.acos(dot > 1 ? 1 : dot < -1 ? -1 : dot);
    // ~500 km core, with a wide conurbation halo. The halo matters more than
    // it looks: without it only a dozen megacities register at globe scale
    // and the continents read as empty.
    const near = Math.exp(-Math.pow(d / 0.085, 1.6));
    const halo = Math.exp(-Math.pow(d / 0.33, 1.35)) * 0.42;
    const v = flat[i + 3] * (near > halo ? near : halo);
    if (v > best) best = v;
  }
  return best;
}

function unit(lonDeg: number, latDeg: number, out: Float64Array): void {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const c = Math.cos(lat);
  out[0] = c * Math.cos(lon);
  out[1] = Math.sin(lat);
  out[2] = c * Math.sin(lon);
}

const scratchUnit = new Float64Array(3);

function metroTerm(
  lonDeg: number,
  latDeg: number,
  extra: readonly (readonly [number, number, number])[],
): number {
  unit(lonDeg, latDeg, scratchUnit);
  return metroTermFlat(scratchUnit[0], scratchUnit[1], scratchUnit[2], flatten(extra));
}

/** Everything that is cheap: the roughness and the polar falloff. */
function finish(lonDeg: number, latDeg: number, best: number): number {
  // Sparse settlement everywhere habitable, so continents are not empty
  // between the metros — but thin, and thinner towards the poles.
  const polar = Math.max(0, 1 - Math.pow(Math.abs(latDeg) / 72, 2.4));
  const scatter = Math.pow(rough(lonDeg, latDeg), 1.7) * 0.42 * polar;
  return Math.min(1, best * (0.75 + rough(lonDeg * 3.1, latDeg * 3.1) * 0.5) + scatter);
}

/**
 * Urbanisation at a point, 0..1.
 *
 * `extra` lets the caller fold in the company's own locations so the division
 * anchors always sit on visible cities.
 */
export function urbanisation(
  lonDeg: number,
  latDeg: number,
  extra: readonly (readonly [number, number, number])[] = [],
): number {
  return finish(lonDeg, latDeg, metroTerm(lonDeg, latDeg, extra));
}

/*
 * The attractor term, precomputed.
 *
 * Placing the towers and the city lights asks for urbanisation over a million
 * times, and each call walked fifty metros doing an arc plus two pow/exp — a
 * quarter of a billion transcendentals, and 5.2 of the 5.4 seconds the build
 * took. The attractors are wide, smooth exponentials (a 500 km core is ~5° of
 * arc), so sampling them on a 256x128 grid and interpolating loses nothing
 * visible. The roughness is *not* baked in: it carries the high-frequency
 * detail and stays exact per point, where it is cheap anyway.
 */
export const METRO_W = 256;
export const METRO_H = 128;

export function buildMetroField(
  extra: readonly (readonly [number, number, number])[] = [],
): Float32Array {
  const f = new Float32Array(METRO_W * METRO_H);
  const flat = flatten(extra);
  const u = new Float64Array(3);
  for (let y = 0; y < METRO_H; y++) {
    const lat = 90 - ((y + 0.5) * 180) / METRO_H;
    for (let x = 0; x < METRO_W; x++) {
      const lon = ((x + 0.5) * 360) / METRO_W - 180;
      unit(lon, lat, u);
      f[y * METRO_W + x] = metroTermFlat(u[0], u[1], u[2], flat);
    }
  }
  return f;
}

/** Same result as urbanisation(), with the attractor term read off the field. */
export function urbanisationAt(field: Float32Array, lonDeg: number, latDeg: number): number {
  // Bilinear, wrapping in longitude and clamping in latitude.
  const fx = ((lonDeg + 180) / 360) * METRO_W - 0.5;
  const fy = ((90 - latDeg) / 180) * METRO_H - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;
  const wrap = (x: number): number => ((x % METRO_W) + METRO_W) % METRO_W;
  const clampY = (y: number): number => (y < 0 ? 0 : y > METRO_H - 1 ? METRO_H - 1 : y);
  const xa = wrap(x0);
  const xb = wrap(x0 + 1);
  const ya = clampY(y0) * METRO_W;
  const yb = clampY(y0 + 1) * METRO_W;
  const top = field[ya + xa] + (field[ya + xb] - field[ya + xa]) * tx;
  const bot = field[yb + xa] + (field[yb + xb] - field[yb + xa]) * tx;
  return finish(lonDeg, latDeg, top + (bot - top) * ty);
}
