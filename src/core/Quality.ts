import type { Ticker } from './Ticker';
import type { Viewport } from './Viewport';

export type Tier = 'low' | 'mid' | 'high';

export interface QualitySettings {
  tier: Tier;
  /** Particles in the morph system. */
  particles: number;
  /** Background starfield points. */
  stars: number;
  /** Instanced towers standing on the land. */
  buildings: number;
  /** Metropolitan light points on the globe. */
  cityLights: number;
  /** Icosphere subdivision level for the network wireframe. */
  meshDetail: number;
  bloom: boolean;
  maxDpr: number;
}

const PRESETS: Record<Tier, Omit<QualitySettings, 'tier'>> = {
  low: {
    particles: 45_000, stars: 2_600, buildings: 14_000, cityLights: 5_000,
    meshDetail: 2, bloom: true, maxDpr: 1.25,
  },
  mid: {
    particles: 120_000, stars: 5_200, buildings: 32_000, cityLights: 11_000,
    meshDetail: 3, bloom: true, maxDpr: 1.75,
  },
  high: {
    particles: 240_000, stars: 8_000, buildings: 60_000, cityLights: 18_000,
    meshDetail: 3, bloom: true, maxDpr: 2,
  },
};

const ORDER: Tier[] = ['low', 'mid', 'high'];

/**
 * Picks a starting tier from cheap signals, then watches the real frame rate
 * and steps down if the machine cannot hold it.
 *
 * Stepping *down* only. Oscillating between tiers is worse than running one
 * notch below optimum, because every switch rebuilds buffers.
 */
export class Quality {
  settings: QualitySettings;
  onChange: ((s: QualitySettings) => void) | null = null;

  private slowFrames = 0;
  private fastFrames = 0;
  private locked = false;
  private elapsedSinceChange = 0;

  constructor(
    private ticker: Ticker,
    private viewport: Viewport,
  ) {
    const tier = Quality.guess(viewport);
    this.settings = { tier, ...PRESETS[tier] };
    this.viewport.setMaxDpr(this.settings.maxDpr);
    this.ticker.add(this.watch);
  }

  private static guess(vp: Viewport): Tier {
    const cores = navigator.hardwareConcurrency ?? 4;
    // Not in every browser's lib.dom yet; treat as a hint only.
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const pixels = vp.width * vp.height * vp.dpr * vp.dpr;

    if (vp.isTouch) return cores >= 6 && mem >= 4 ? 'mid' : 'low';
    if (cores <= 4 || mem <= 4) return 'mid';
    // A 5K display costs more than the GPU behind it usually admits.
    if (pixels > 9_000_000 && cores < 12) return 'mid';
    return 'high';
  }

  /** Ignore the first seconds — shader compilation and asset decode skew them. */
  private watch = (dt: number): void => {
    this.elapsedSinceChange += dt;
    if (this.locked || this.elapsedSinceChange < 3) return;

    const fps = this.ticker.fps;
    if (fps < 48) {
      this.slowFrames++;
      this.fastFrames = 0;
    } else {
      this.fastFrames++;
      if (this.fastFrames > 240) this.slowFrames = 0;
    }

    if (this.slowFrames > 90) this.step();
  };

  private step(): void {
    const i = ORDER.indexOf(this.settings.tier);
    if (i <= 0) {
      this.locked = true;
      return;
    }
    const tier = ORDER[i - 1];
    this.settings = { tier, ...PRESETS[tier] };
    this.slowFrames = 0;
    this.fastFrames = 0;
    this.elapsedSinceChange = 0;
    this.viewport.setMaxDpr(this.settings.maxDpr);
    this.onChange?.(this.settings);
    console.info(`[quality] stepped down to "${tier}" (${this.ticker.fps.toFixed(0)} fps)`);
  }

  /** Debug override. */
  force(tier: Tier): void {
    this.settings = { tier, ...PRESETS[tier] };
    this.locked = true;
    this.viewport.setMaxDpr(this.settings.maxDpr);
    this.onChange?.(this.settings);
  }
}
