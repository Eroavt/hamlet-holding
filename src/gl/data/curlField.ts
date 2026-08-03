import { Data3DTexture, LinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';

/**
 * A pre-baked, seamlessly tiling curl-noise volume.
 *
 * Evaluating curl noise analytically in the vertex shader costs eighteen
 * simplex-noise calls per particle. At 240 000 particles that is the single
 * most expensive thing on the frame. Baking the field once into a 32³ RGBA8
 * volume turns it into one trilinear texture fetch — roughly two orders of
 * magnitude cheaper, and visually identical for a field that is only ever
 * used as turbulence.
 *
 * 32³ RGBA = 131 kB, generated in about a millisecond.
 */

const N = 32;

/** Periodic value noise on an integer lattice, smoothstep-interpolated. */
function makeLattice(period: number, seed: number): Float32Array {
  const g = new Float32Array(period * period * period);
  let s = seed * 9301 + 49297;
  for (let i = 0; i < g.length; i++) {
    s = (s * 9301 + 49297) % 233280;
    g[i] = (s / 233280) * 2 - 1;
  }
  return g;
}

function sampleLattice(g: Float32Array, period: number, x: number, y: number, z: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const tx = x - fx;
  const ty = y - fy;
  const tz = z - fz;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const sz = tz * tz * (3 - 2 * tz);

  const w = (ix: number, iy: number, iz: number): number => {
    const a = ((ix % period) + period) % period;
    const b = ((iy % period) + period) % period;
    const c = ((iz % period) + period) % period;
    return g[(c * period + b) * period + a];
  };

  const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

  const c00 = lerp(w(fx, fy, fz), w(fx + 1, fy, fz), sx);
  const c10 = lerp(w(fx, fy + 1, fz), w(fx + 1, fy + 1, fz), sx);
  const c01 = lerp(w(fx, fy, fz + 1), w(fx + 1, fy, fz + 1), sx);
  const c11 = lerp(w(fx, fy + 1, fz + 1), w(fx + 1, fy + 1, fz + 1), sx);

  return lerp(lerp(c00, c10, sy), lerp(c01, c11, sy), sz);
}

/** Two-octave periodic noise over the [0, N) volume. */
function potential(
  lat1: Float32Array,
  lat2: Float32Array,
  x: number,
  y: number,
  z: number,
): number {
  const a = sampleLattice(lat1, 4, (x / N) * 4, (y / N) * 4, (z / N) * 4);
  const b = sampleLattice(lat2, 8, (x / N) * 8, (y / N) * 8, (z / N) * 8);
  return a + b * 0.5;
}

export function buildCurlTexture(): Data3DTexture {
  // Three independent potentials → one vector potential field.
  const lats: Float32Array[] = [];
  for (let i = 0; i < 6; i++) lats.push(makeLattice(i % 2 === 0 ? 4 : 8, i + 1));

  const P = new Float32Array(N * N * N * 3);
  for (let z = 0; z < N; z++) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const i = ((z * N + y) * N + x) * 3;
        P[i] = potential(lats[0], lats[1], x, y, z);
        P[i + 1] = potential(lats[2], lats[3], x, y, z);
        P[i + 2] = potential(lats[4], lats[5], x, y, z);
      }
    }
  }

  const at = (x: number, y: number, z: number, c: number): number => {
    const a = ((x % N) + N) % N;
    const b = ((y % N) + N) % N;
    const d = ((z % N) + N) % N;
    return P[((d * N + b) * N + a) * 3 + c];
  };

  // curl(P) via central differences — divergence free, so the particles swirl
  // instead of piling up in sources and sinks.
  const raw = new Float32Array(N * N * N * 3);
  let max = 1e-6;
  for (let z = 0; z < N; z++) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dPz_dy = (at(x, y + 1, z, 2) - at(x, y - 1, z, 2)) * 0.5;
        const dPy_dz = (at(x, y, z + 1, 1) - at(x, y, z - 1, 1)) * 0.5;
        const dPx_dz = (at(x, y, z + 1, 0) - at(x, y, z - 1, 0)) * 0.5;
        const dPz_dx = (at(x + 1, y, z, 2) - at(x - 1, y, z, 2)) * 0.5;
        const dPy_dx = (at(x + 1, y, z, 1) - at(x - 1, y, z, 1)) * 0.5;
        const dPx_dy = (at(x, y + 1, z, 0) - at(x, y - 1, z, 0)) * 0.5;

        const i = ((z * N + y) * N + x) * 3;
        raw[i] = dPz_dy - dPy_dz;
        raw[i + 1] = dPx_dz - dPz_dx;
        raw[i + 2] = dPy_dx - dPx_dy;

        max = Math.max(max, Math.abs(raw[i]), Math.abs(raw[i + 1]), Math.abs(raw[i + 2]));
      }
    }
  }

  const data = new Uint8Array(N * N * N * 4);
  const inv = 1 / max;
  for (let i = 0, o = 0; i < raw.length; i += 3, o += 4) {
    data[o] = Math.round((raw[i] * inv * 0.5 + 0.5) * 255);
    data[o + 1] = Math.round((raw[i + 1] * inv * 0.5 + 0.5) * 255);
    data[o + 2] = Math.round((raw[i + 2] * inv * 0.5 + 0.5) * 255);
    data[o + 3] = 255;
  }

  const tex = new Data3DTexture(data, N, N, N);
  tex.format = RGBAFormat;
  tex.type = UnsignedByteType;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.wrapR = RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}
