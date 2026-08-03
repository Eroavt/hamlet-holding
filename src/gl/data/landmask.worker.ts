/// <reference lib="webworker" />
import { rasterizeLand, isLand, latLonToVec3 } from './rasterizeLand';
import { urbanisation } from './urbanField';

export interface BuildRequest {
  count: number;
  /** Share of particles that end up on the globe; the rest become the halo. */
  globeShare: number;
  /** Of the globe particles, the share that must land on a continent. */
  landShare: number;
  /** Instanced towers standing on the land. */
  buildings: number;
  /** Metropolitan light points scattered over the same urbanisation field. */
  cityLights: number;
  /** The company's own locations, folded into the urbanisation field. */
  anchors: readonly (readonly [number, number, number])[];
  gridWidth: number;
  gridHeight: number;
}

export interface BuildResult {
  /** count * 3 — where the particle comes to rest. Its length is its radius. */
  positions: Float32Array;
  /** count * 4 — [shell, size, peakRadius, tint] */
  meta: Float32Array;
  /** count — 1 = belongs to the globe, 0 = stays in the halo. */
  role: Uint8Array;
  /** count — 1 = sits on a continent (globe particles only). */
  land: Uint8Array;
  /** buildings * 3 — footprint centre on the unit sphere. */
  bPos: Float32Array;
  /** buildings * 4 — [height, halfWidth, yaw, seed] */
  bMeta: Float32Array;
  /** cityLights * 3 — position on the unit sphere. */
  cPos: Float32Array;
  /** cityLights * 2 — [intensity 0..1, seed] */
  cMeta: Float32Array;
  grid: Uint8Array;
  gridWidth: number;
  gridHeight: number;
}

const HALO_INNER = 1.45;
const HALO_OUTER = 4.3;
/** Discrete shells. Each launches at its own moment — that is the ring look. */
const BANDS = 5;
/** Angular size of the lattice the continents are quantised onto, in degrees. */
const LATTICE = 2.6;

/* ---------------------------------------------------------------- noise ---
 * A small periodic value-noise field. The halo is sampled against it so the
 * dust clumps into filaments instead of sitting there as even static — that
 * fractal texture is what makes the reference cloud read as matter rather
 * than as a particle count.
 */
const P = 16;
const lattice = (() => {
  const g = new Float32Array(P * P * P);
  let s = 1337;
  for (let i = 0; i < g.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    g[i] = s / 233280;
  }
  return g;
})();

function vnoise(x: number, y: number, z: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const tx = x - fx;
  const ty = y - fy;
  const tz = z - fz;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const sz = tz * tz * (3 - 2 * tz);
  const at = (ix: number, iy: number, iz: number): number =>
    lattice[((((iz % P) + P) % P) * P + (((iy % P) + P) % P)) * P + (((ix % P) + P) % P)];
  const lp = (a: number, b: number, t: number): number => a + (b - a) * t;
  const c00 = lp(at(fx, fy, fz), at(fx + 1, fy, fz), sx);
  const c10 = lp(at(fx, fy + 1, fz), at(fx + 1, fy + 1, fz), sx);
  const c01 = lp(at(fx, fy, fz + 1), at(fx + 1, fy, fz + 1), sx);
  const c11 = lp(at(fx, fy + 1, fz + 1), at(fx + 1, fy + 1, fz + 1), sx);
  return lp(lp(c00, c10, sy), lp(c01, c11, sy), sz);
}

/** Two octaves, biased so most of the volume is empty and the rest is dense. */
function density(x: number, y: number, z: number): number {
  const a = vnoise(x * 1.1, y * 1.1, z * 1.1);
  const b = vnoise(x * 2.7 + 5.5, y * 2.7 - 3.1, z * 2.7 + 8.2);
  return Math.pow(a * 0.65 + b * 0.35, 2.1);
}

/**
 * Towers, placed by urbanisation rather than by area.
 *
 * Rejection sampling against the urbanisation field concentrates the mass into
 * real metropolitan clusters, so the planet is legible from the pattern of its
 * cities. Height follows the same field: a metro core gets the tall towers,
 * the scatter between them gets low-rise.
 */
function placeBuildings(
  n: number,
  grid: ReturnType<typeof rasterizeLand>,
  anchors: BuildRequest['anchors'],
): { bPos: Float32Array; bMeta: Float32Array } {
  const bPos = new Float32Array(n * 3);
  const bMeta = new Float32Array(n * 4);
  const scratch = new Float32Array(3);

  for (let i = 0; i < n; i++) {
    let lat = 0;
    let lon = 0;
    let u = 0;

    for (let tries = 0; tries < 96; tries++) {
      lat = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
      lon = Math.random() * 360 - 180;
      if (Math.abs(lat) > 74 || !isLand(grid, lon, lat)) continue;
      u = urbanisation(lon, lat, anchors);
      if (u > Math.random() * 0.55) break;
    }

    latLonToVec3(lat, lon, scratch);
    bPos[i * 3] = scratch[0];
    bPos[i * 3 + 1] = scratch[1];
    bPos[i * 3 + 2] = scratch[2];

    // A handful of landmarks per cluster stand well clear of their neighbours;
    // a skyline that is all one height reads as a bar chart.
    const spike = Math.pow(Math.random(), 7) * 1.9;
    bMeta[i * 4] = (0.006 + Math.pow(u, 1.4) * 0.03) * (0.45 + Math.random() * 0.8 + spike);
    bMeta[i * 4 + 1] = 0.0016 + Math.random() * 0.0022;
    bMeta[i * 4 + 2] = Math.random() * Math.PI * 2;
    bMeta[i * 4 + 3] = Math.random();
  }

  return { bPos, bMeta };
}

/**
 * The lights of the world's metropolitan regions.
 *
 * Same field as the towers, but sampled against a steeper curve so the points
 * pile into the conurbations instead of spreading evenly over the land. That
 * steepness is what makes the eastern seaboard, the Rhine-Ruhr, the Pearl
 * River Delta and the Tokyo-Osaka corridor legible from orbit — the planet is
 * recognised by where people are, not by its coastlines.
 */
function placeCityLights(
  n: number,
  grid: ReturnType<typeof rasterizeLand>,
  anchors: BuildRequest['anchors'],
): { cPos: Float32Array; cMeta: Float32Array } {
  const cPos = new Float32Array(n * 3);
  const cMeta = new Float32Array(n * 2);
  const scratch = new Float32Array(3);

  for (let i = 0; i < n; i++) {
    let lat = 0;
    let lon = 0;
    let u = 0;

    for (let tries = 0; tries < 128; tries++) {
      lat = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
      lon = Math.random() * 360 - 180;
      if (Math.abs(lat) > 76 || !isLand(grid, lon, lat)) continue;
      u = urbanisation(lon, lat, anchors);
      // Squaring the acceptance concentrates the sample into real cities.
      if (u * u > Math.random() * 0.32) break;
    }

    latLonToVec3(lat, lon, scratch);
    // A hair above the surface so the lights sit on top of the towers rather
    // than inside them.
    const r = 1.004;
    cPos[i * 3] = scratch[0] * r;
    cPos[i * 3 + 1] = scratch[1] * r;
    cPos[i * 3 + 2] = scratch[2] * r;

    cMeta[i * 2] = Math.min(1, u * (0.55 + Math.random() * 0.75));
    cMeta[i * 2 + 1] = Math.random();
  }

  return { cPos, cMeta };
}

self.onmessage = (e: MessageEvent<BuildRequest>) => {
  const { count, globeShare, landShare, buildings, cityLights, anchors, gridWidth, gridHeight } =
    e.data;
  const grid = rasterizeLand(gridWidth, gridHeight);

  const positions = new Float32Array(count * 3);
  const meta = new Float32Array(count * 4);
  const role = new Uint8Array(count);
  const land = new Uint8Array(count);
  const scratch = new Float32Array(3);

  const globeCount = Math.round(count * globeShare);
  const wantLand = Math.round(globeCount * landShare);

  for (let i = 0; i < count; i++) {
    const isGlobe = i < globeCount;
    let x = 0;
    let y = 0;
    let z = 0;
    let radius = 1;
    let onLand = 0;
    let band = 0;

    if (isGlobe) {
      const needLand = i < wantLand;
      let lat = 0;
      let lon = 0;
      for (let tries = 0; tries < 64; tries++) {
        lat = (Math.asin(Math.random() * 2 - 1) * 180) / Math.PI;
        lon = Math.random() * 360 - 180;
        if (!needLand || (Math.abs(lat) < 74 && isLand(grid, lon, lat))) break;
      }

      if (needLand) {
        // Snap to a roughly equal-area lattice. A photographic scatter reads
        // as a map; a lattice reads as a readout. The brief is a hologram.
        const stepLon = LATTICE / Math.max(0.18, Math.cos((lat * Math.PI) / 180));
        lat = Math.round(lat / LATTICE) * LATTICE + (Math.random() - 0.5) * 0.5;
        lon = Math.round(lon / stepLon) * stepLon + (Math.random() - 0.5) * 0.5;
        onLand = 1;
      }

      latLonToVec3(lat, lon, scratch);
      radius = 1 + (Math.random() - 0.5) * (needLand ? 0.012 : 0.026);
      x = scratch[0] * radius;
      y = scratch[1] * radius;
      z = scratch[2] * radius;
    } else {
      // Halo. Assigning a discrete band first and only then a radius inside
      // it is what makes the blast leave as separate concentric rings — a
      // continuous distribution just produces one thick shell.
      band = Math.floor(Math.random() * BANDS);
      const t0 = band / BANDS;
      const t1 = (band + 1) / BANDS;
      const lo = HALO_INNER + (HALO_OUTER - HALO_INNER) * Math.pow(t0, 0.78);
      const hi = HALO_INNER + (HALO_OUTER - HALO_INNER) * Math.pow(t1, 0.78);

      for (let tries = 0; tries < 24; tries++) {
        const u = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        // Centred on the band but allowed to bleed well past its edges. The
        // discrete *launch* is what draws the rings during the blast; if the
        // resting radii stayed inside their band the settled halo would look
        // like a stack of hoops instead of a cloud.
        const k = 0.5 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.95;
        const r = lo + (hi - lo) * k;
        x = r * s * Math.cos(theta);
        // Flattened: the reference halo is a disc seen slightly off-axis.
        y = r * u * 0.5;
        z = r * s * Math.sin(theta);
        // Rejection against the density field clumps the dust into filaments.
        if (density(x * 0.55 + 8, y * 0.55 + 8, z * 0.55 + 8) > Math.random() * 0.4) break;
      }
      radius = Math.hypot(x, y, z);
    }

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Launch delay. Halo particles inherit their band, so a whole ring leaves
    // together; globe particles go early and as one group, because they have
    // the longest journey — out past everything, then back to the centre.
    const shell = isGlobe ? Math.random() * 0.16 : band / BANDS + Math.random() * 0.06;

    // How far the particle overshoots before settling. Halo particles barely
    // overshoot; globe particles are thrown far out and then hauled back in,
    // which is the moment the sphere condenses.
    const peak = isGlobe ? 2.7 + Math.random() * 1.9 : radius * (1.06 + Math.random() * 0.22);

    meta[i * 4] = shell;
    meta[i * 4 + 1] = isGlobe
      ? (onLand ? 0.72 : 0.42) + Math.random() * 0.4
      : 0.55 + Math.random() * 0.75;
    meta[i * 4 + 2] = peak;
    meta[i * 4 + 3] = Math.random();

    role[i] = isGlobe ? 1 : 0;
    land[i] = onLand;
  }

  // Decorrelate buffer order from generation order, otherwise the globe
  // particles all sit in one contiguous block and draw in visible bands.
  let seed = 0x9e3779b9;
  const rnd = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let i = count - 1; i > 0; i--) {
    const k = Math.floor(rnd() * (i + 1));
    for (let c = 0; c < 3; c++) {
      const a = positions[i * 3 + c];
      positions[i * 3 + c] = positions[k * 3 + c];
      positions[k * 3 + c] = a;
    }
    for (let c = 0; c < 4; c++) {
      const b = meta[i * 4 + c];
      meta[i * 4 + c] = meta[k * 4 + c];
      meta[k * 4 + c] = b;
    }
    const r = role[i];
    role[i] = role[k];
    role[k] = r;
    const l = land[i];
    land[i] = land[k];
    land[k] = l;
  }

  const { bPos, bMeta } = placeBuildings(buildings, grid, anchors);
  const { cPos, cMeta } = placeCityLights(cityLights, grid, anchors);

  const result: BuildResult = {
    positions,
    meta,
    role,
    land,
    bPos,
    bMeta,
    cPos,
    cMeta,
    grid: grid.data,
    gridWidth: grid.width,
    gridHeight: grid.height,
  };

  (self as unknown as Worker).postMessage(result, [
    positions.buffer,
    meta.buffer,
    role.buffer,
    land.buffer,
    bPos.buffer,
    bMeta.buffer,
    cPos.buffer,
    cMeta.buffer,
    grid.data.buffer,
  ]);
};
