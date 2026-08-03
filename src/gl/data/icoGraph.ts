import { IcosahedronGeometry } from 'three';
import type { LandGrid } from './rasterizeLand';
import { isLand } from './rasterizeLand';

export interface IcoGraph {
  /** 2 vertices per edge, xyz — ready for THREE.LineSegments. */
  positions: Float32Array;
  /** Per vertex: shared stagger seed for the two endpoints of an edge. */
  seeds: Float32Array;
  /** Per vertex: 1 if the edge midpoint sits over land. */
  land: Float32Array;
  edgeCount: number;
}

/** How far vertices slide across the surface, in radians of arc. */
const JITTER = 0.055;
/**
 * Share of edges thrown away. Kept low: in the reference artwork the network
 * wraps the whole sphere, water included — the mesh is the object's structure,
 * not a decoration on the continents.
 */
const DROP_OCEAN = 0.16;
const DROP_LAND = 0.04;

/**
 * The network mesh.
 *
 * An icosphere gives an almost-uniform triangulation for free, but straight
 * out of the box it looks like a manufactured lattice. Two passes fix that:
 * vertices are pushed sideways along the surface so the cells become uneven,
 * and a large share of the edges is dropped — denser over land, sparser over
 * water — so the mesh suggests geography instead of drawing it.
 */
export function buildIcoGraph(detail: number, grid: LandGrid): IcoGraph {
  const geo = new IcosahedronGeometry(1, detail);
  const src = geo.getAttribute('position').array as ArrayLike<number>;

  // Weld duplicated vertices — IcosahedronGeometry is non-indexed.
  const key = (i: number): string =>
    `${src[i * 3].toFixed(4)},${src[i * 3 + 1].toFixed(4)},${src[i * 3 + 2].toFixed(4)}`;

  const index = new Map<string, number>();
  const verts: number[] = [];
  const remap = new Int32Array(src.length / 3);

  for (let i = 0; i < src.length / 3; i++) {
    const k = key(i);
    let id = index.get(k);
    if (id === undefined) {
      id = verts.length / 3;
      index.set(k, id);
      verts.push(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]);
    }
    remap[i] = id;
  }

  for (let v = 0; v < verts.length / 3; v++) {
    const x = verts[v * 3];
    const y = verts[v * 3 + 1];
    const z = verts[v * 3 + 2];

    // Tangent basis: any helper vector not parallel to the normal will do.
    const hx = Math.abs(y) < 0.9 ? 0 : 1;
    const hy = Math.abs(y) < 0.9 ? 1 : 0;
    let tx = hy * z - 0 * y;
    let ty = 0 * x - hx * z;
    let tz = hx * y - hy * x;
    const tl = Math.hypot(tx, ty, tz) || 1;
    tx /= tl;
    ty /= tl;
    tz /= tl;
    const bx = y * tz - z * ty;
    const by = z * tx - x * tz;
    const bz = x * ty - y * tx;

    const a = Math.random() * Math.PI * 2;
    const m = JITTER * (0.35 + Math.random() * 0.65);
    const nx = x + (tx * Math.cos(a) + bx * Math.sin(a)) * m;
    const ny = y + (ty * Math.cos(a) + by * Math.sin(a)) * m;
    const nz = z + (tz * Math.cos(a) + bz * Math.sin(a)) * m;
    const nl = Math.hypot(nx, ny, nz) || 1;
    verts[v * 3] = nx / nl;
    verts[v * 3 + 1] = ny / nl;
    verts[v * 3 + 2] = nz / nl;
  }

  const edges = new Set<number>();
  const triCount = src.length / 9;
  for (let t = 0; t < triCount; t++) {
    const a = remap[t * 3];
    const b = remap[t * 3 + 1];
    const c = remap[t * 3 + 2];
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      edges.add(Math.min(p, q) * 100_000 + Math.max(p, q));
    }
  }

  geo.dispose();

  const kept: { lo: number; hi: number; land: number }[] = [];
  for (const packed of edges) {
    const lo = Math.floor(packed / 100_000);
    const hi = packed % 100_000;

    const mx = (verts[lo * 3] + verts[hi * 3]) * 0.5;
    const my = (verts[lo * 3 + 1] + verts[hi * 3 + 1]) * 0.5;
    const mz = (verts[lo * 3 + 2] + verts[hi * 3 + 2]) * 0.5;
    const len = Math.hypot(mx, my, mz) || 1;

    const lat = (Math.asin(my / len) * 180) / Math.PI;
    const lon = (Math.atan2(mz / len, -mx / len) * 180) / Math.PI - 180;
    const wrapped = ((((lon + 180) % 360) + 360) % 360) - 180;
    const over = isLand(grid, wrapped, lat) ? 1 : 0;

    if (Math.random() < (over ? DROP_LAND : DROP_OCEAN)) continue;
    kept.push({ lo, hi, land: over });
  }

  const edgeCount = kept.length;
  const positions = new Float32Array(edgeCount * 6);
  const seeds = new Float32Array(edgeCount * 2);
  const land = new Float32Array(edgeCount * 2);

  for (let e = 0; e < edgeCount; e++) {
    const { lo, hi, land: over } = kept[e];
    positions.set(
      [
        verts[lo * 3],
        verts[lo * 3 + 1],
        verts[lo * 3 + 2],
        verts[hi * 3],
        verts[hi * 3 + 1],
        verts[hi * 3 + 2],
      ],
      e * 6,
    );

    // Both endpoints share a seed, otherwise an edge fades in from one side
    // and looks like it is being dragged into place.
    const my = (verts[lo * 3 + 1] + verts[hi * 3 + 1]) * 0.5;
    const seed = Math.min(1, Math.max(0, 1 - (my + 1) * 0.5)) * 0.7 + Math.random() * 0.3;
    seeds[e * 2] = seed;
    seeds[e * 2 + 1] = seed;
    land[e * 2] = over;
    land[e * 2 + 1] = over;
  }

  return { positions, seeds, land, edgeCount };
}

/**
 * Great circles at assorted inclinations. They read as instrument rings and
 * pull the whole object away from "3D model of Earth" towards "projection".
 */
export function buildOrbits(rings: number, segments = 160): Float32Array {
  const out = new Float32Array(rings * segments * 6);
  let o = 0;

  for (let r = 0; r < rings; r++) {
    const tilt = (r / rings) * Math.PI * 0.9 + 0.22;
    const yaw = r * 1.7;
    const radius = 1.12 + r * 0.085;

    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);

    const at = (i: number): [number, number, number] => {
      const a = (i / segments) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      // tilt about X, then yaw about Y
      const y2 = -z * st;
      const z2 = z * ct;
      return [x * cy + z2 * sy, y2, -x * sy + z2 * cy];
    };

    for (let i = 0; i < segments; i++) {
      const p = at(i);
      const q = at(i + 1);
      out[o++] = p[0];
      out[o++] = p[1];
      out[o++] = p[2];
      out[o++] = q[0];
      out[o++] = q[1];
      out[o++] = q[2];
    }
  }

  return out;
}
