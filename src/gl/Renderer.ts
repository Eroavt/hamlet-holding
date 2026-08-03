import { WebGLRenderer, Scene, Color, ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import type { Viewport } from '@/core/Viewport';

export class Renderer {
  readonly gl: WebGLRenderer;
  readonly scene = new Scene();

  constructor(canvas: HTMLCanvasElement, viewport: Viewport) {
    this.gl = new WebGLRenderer({
      canvas,
      // Antialiasing costs ~30 % of the frame and buys nothing here: every
      // visible edge is either an additive point sprite or a bloomed line.
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      failIfMajorPerformanceCaveat: false,
      // Only in dev, so the capture endpoint can read the buffer after a frame.
      preserveDrawingBuffer: import.meta.env.DEV,
    });

    this.gl.setPixelRatio(viewport.dpr);
    this.gl.setSize(viewport.width, viewport.height, false);
    this.gl.setClearColor(new Color(0x010105), 1);
    this.gl.toneMapping = ACESFilmicToneMapping;
    this.gl.toneMappingExposure = 1.05;
    this.gl.outputColorSpace = SRGBColorSpace;

    this.scene.background = new Color(0x010105);
  }

  get supported(): boolean {
    return this.gl.capabilities.isWebGL2;
  }

  resize(width: number, height: number, dpr: number): void {
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(width, height, false);
  }

  dispose(): void {
    this.gl.dispose();
  }
}
