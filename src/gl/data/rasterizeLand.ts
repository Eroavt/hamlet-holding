import { LAND_RINGS, antarcticaLat } from './worldLand';

export interface LandGrid {
  data: Uint8Array;
  width: number;
  height: number;
}

/**
 * Scanline-fills the coastline rings into an equirectangular occupancy grid.
 *
 * Cost is O(rows x edges), not O(pixels x edges) — roughly 0.4 ms for a
 * 1024x512 grid, versus ~200 ms for the naive point-in-polygon per cell.
 */
export function rasterizeLand(width = 1024, height = 512): LandGrid {
  const data = new Uint8Array(width * height);
  const xs: number[] = [];

  for (let y = 0; y < height; y++) {
    const lat = 90 - ((y + 0.5) * 180) / height;
    xs.length = 0;

    for (const ring of LAND_RINGS) {
      const n = ring.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lon1 = ring[i * 2];
        const lat1 = ring[i * 2 + 1];
        const lon2 = ring[j * 2];
        const lat2 = ring[j * 2 + 1];

        // Half-open rule: counts each vertex once, so shared endpoints do not
        // produce duplicate crossings.
        if (lat1 <= lat === lat2 <= lat) continue;
        const t = (lat - lat1) / (lat2 - lat1);
        xs.push(lon1 + t * (lon2 - lon1));
      }
    }

    if (xs.length > 1) {
      xs.sort((a, b) => a - b);
      const row = y * width;
      for (let k = 0; k + 1 < xs.length; k += 2) {
        let c0 = Math.round(((xs[k] + 180) / 360) * width);
        let c1 = Math.round(((xs[k + 1] + 180) / 360) * width);
        if (c1 < c0) [c0, c1] = [c1, c0];
        c0 = Math.max(0, c0);
        c1 = Math.min(width - 1, c1);
        for (let x = c0; x <= c1; x++) data[row + x] = 1;
      }
    }

    if (lat < -60) {
      const row = y * width;
      for (let x = 0; x < width; x++) {
        const lon = ((x + 0.5) / width) * 360 - 180;
        if (lat < antarcticaLat(lon)) data[row + x] = 1;
      }
    }
  }

  return { data, width, height };
}

/** Samples the grid at a direction on the unit sphere. */
export function isLand(grid: LandGrid, lonDeg: number, latDeg: number): boolean {
  let x = Math.floor(((lonDeg + 180) / 360) * grid.width);
  let y = Math.floor(((90 - latDeg) / 180) * grid.height);
  x = x < 0 ? 0 : x >= grid.width ? grid.width - 1 : x;
  y = y < 0 ? 0 : y >= grid.height ? grid.height - 1 : y;
  return grid.data[y * grid.width + x] === 1;
}

/** Longitude/latitude in degrees to a point on the unit sphere (y up). */
export function latLonToVec3(latDeg: number, lonDeg: number, out: Float32Array, i = 0): void {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lonDeg + 180) * (Math.PI / 180);
  const s = Math.sin(phi);
  out[i] = -s * Math.cos(theta);
  out[i + 1] = Math.cos(phi);
  out[i + 2] = s * Math.sin(theta);
}
