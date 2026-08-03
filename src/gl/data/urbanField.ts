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

/** Great-circle distance in radians. */
function arc(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const p1 = lat1 * DEG;
  const p2 = lat2 * DEG;
  const dp = (lat2 - lat1) * DEG;
  const dl = (lon2 - lon1) * DEG;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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
export function urbanisation(
  lonDeg: number,
  latDeg: number,
  extra: readonly (readonly [number, number, number])[] = [],
): number {
  let best = 0;

  for (const list of [METROS, extra]) {
    for (const [lon, lat, weight] of list) {
      const d = arc(lonDeg, latDeg, lon, lat);
      // ~500 km core, with a wide conurbation halo. The halo matters more than
      // it looks: without it only a dozen megacities register at globe scale
      // and the continents read as empty.
      const near = Math.exp(-Math.pow(d / 0.085, 1.6));
      const halo = Math.exp(-Math.pow(d / 0.33, 1.35)) * 0.42;
      const v = weight * Math.max(near, halo);
      if (v > best) best = v;
    }
  }

  // Sparse settlement everywhere habitable, so continents are not empty
  // between the metros — but thin, and thinner towards the poles.
  const polar = Math.max(0, 1 - Math.pow(Math.abs(latDeg) / 72, 2.4));
  const scatter = Math.pow(rough(lonDeg, latDeg), 1.7) * 0.42 * polar;

  return Math.min(1, best * (0.75 + rough(lonDeg * 3.1, latDeg * 3.1) * 0.5) + scatter);
}
