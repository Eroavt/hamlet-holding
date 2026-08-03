import gsap from 'gsap';
import { Group, Vector3, type Data3DTexture } from 'three';
import { Starfield } from './scenes/Starfield';
import { Nebula } from './scenes/Nebula';
import { Morph } from './scenes/Morph';
import { Buildings } from './scenes/Buildings';
import { CityLights } from './scenes/CityLights';
import { GlobeShell } from './scenes/GlobeShell';
import { DIVISIONS } from '@/content/divisions';
import { buildCurlTexture } from './data/curlField';
import { buildIcoGraph } from './data/icoGraph';
import type { BuildRequest, BuildResult } from './data/landmask.worker';
import type { Renderer } from './Renderer';
import type { Camera } from './Camera';
import type { QualitySettings } from '@/core/Quality';

const GRID_W = 1024;
const GRID_H = 512;
const Y_AXIS = new Vector3(0, 1, 0);

export class World {
  /** Holds everything that belongs to the globe, so the detail view can move
   *  the whole body without touching the camera or the background. */
  readonly root = new Group();

  starfield!: Starfield;
  nebula!: Nebula;
  morph!: Morph;
  buildings!: Buildings;
  cityLights!: CityLights;
  shell!: GlobeShell;
  /** The selected division's mark, in dust. Lives outside `root` so the globe
   *  can drop away beneath it without dragging it along. */

  /** Continuous rotation of the globe, in radians per second. */
  spinSpeed = 0.035;
  /** Additional rotation used to bring a region round to face the camera. */
  aim = 0;

  private spin = 0;

  /** Rotation the globe is actually drawn at, aim offset included. */
  get totalSpin(): number {
    return this.spin + this.aim;
  }
  private curl: Data3DTexture;
  private focusBase: Vector3 | null = null;
  private focusRotated = new Vector3();

  constructor(
    private renderer: Renderer,
    private camera: Camera,
    private quality: QualitySettings,
  ) {
    this.curl = buildCurlTexture();
  }

  /**
   * Builds everything and only resolves once the GPU is genuinely ready.
   *
   * The compile step at the end is not optional: without it the first frame
   * of the collapse pays for shader compilation — a 150–300 ms freeze at
   * precisely the moment the user clicked.
   */
  async load(onProgress: (v: number) => void): Promise<void> {
    onProgress(0.08);

    this.nebula = new Nebula();
    this.camera.cam.add(this.nebula.mesh);
    this.renderer.scene.add(this.camera.cam);

    this.starfield = new Starfield(this.quality.stars);
    this.renderer.scene.add(this.starfield.points);
    this.renderer.scene.add(this.root);
    onProgress(0.22);

    const data = await this.sample();
    onProgress(0.58);

    this.morph = new Morph(this.curl);
    this.morph.setData(data, this.quality.particles);
    this.root.add(this.morph.points);

    this.buildings = new Buildings();
    this.buildings.setData(data);
    this.root.add(this.buildings.mesh);

    this.cityLights = new CityLights(this.buildings.sun);
    this.cityLights.setData(data);
    this.root.add(this.cityLights.points);
    onProgress(0.76);

    const graph = buildIcoGraph(this.quality.meshDetail, {
      data: data.grid,
      width: data.gridWidth,
      height: data.gridHeight,
    });
    this.shell = new GlobeShell(graph);
    this.root.add(
      this.shell.glow,
      this.shell.core,
      this.shell.lines,
      this.shell.orbits,
      this.shell.atmosphere,
    );
    onProgress(0.88);

    this.setDpr(this.renderer.gl.getPixelRatio());
    await this.renderer.gl.compileAsync(this.renderer.scene, this.camera.cam);
    onProgress(1);
  }

  private sample(): Promise<BuildResult> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL('./data/landmask.worker.ts', import.meta.url), {
        type: 'module',
      });
      const req: BuildRequest = {
        count: this.quality.particles,
        // Most of the material stays outside as the permanent halo — in the
        // reference the cloud never resolves into the globe, it surrounds it.
        globeShare: 0.4,
        // Lower than before: the towers now carry the land, so a dense point
        // cloud on top of them would only wash them out.
        landShare: 0.5,
        buildings: this.quality.buildings,
        cityLights: this.quality.cityLights,
        anchors: DIVISIONS.map((d) => [d.lon, d.lat, 0.95] as const),
        gridWidth: GRID_W,
        gridHeight: GRID_H,
      };
      worker.onmessage = (e: MessageEvent<BuildResult>) => {
        worker.terminate();
        resolve(e.data);
      };
      worker.onerror = (err) => {
        worker.terminate();
        reject(new Error(`landmask worker failed: ${err.message}`));
      };
      worker.postMessage(req);
    });
  }

  setDpr(dpr: number): void {
    this.starfield.dpr = dpr;
    this.morph.dpr = dpr;
    this.cityLights.dpr = dpr;
  }

  resize(_width: number, height: number, dpr: number, fov: number, aspect: number): void {
    void height;
    this.nebula.fit(fov, aspect);
    this.setDpr(dpr);
  }

  /** Pass the un-rotated direction; the spin is applied every frame. */
  setFocus(dir: Vector3 | null): void {
    this.focusBase = dir ? dir.clone() : null;
    if (!dir) this.morph.setFocus(null);
  }

  /**
   * Turns the globe so `dir` faces the camera, taking the short way round.
   * Rotating p by `a` about Y gives z' = c·pz − s·px, which peaks at
   * a = atan2(−px, pz).
   */
  aimAt(dir: Vector3): void {
    const target = Math.atan2(-dir.x, dir.z);
    let delta = target - (this.spin + this.aim);
    const TAU = Math.PI * 2;
    delta = ((((delta + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
    gsap.to(this, { aim: this.aim + delta, duration: 1.3, ease: 'power3.inOut', overwrite: 'auto' });
  }

  /** Unwinds the aim offset back to the free-running rotation. */
  releaseAim(): void {
    const TAU = Math.PI * 2;
    let a = this.aim % TAU;
    if (a > Math.PI) a -= TAU;
    if (a < -Math.PI) a += TAU;
    this.aim = a;
    gsap.to(this, { aim: 0, duration: 1.1, ease: 'power3.inOut', overwrite: 'auto' });
  }

  update(dt: number, elapsed: number): void {
    this.spin += dt * this.spinSpeed;
    const total = this.spin + this.aim;
    this.morph.spin = total;
    this.shell.spin = total;
    this.buildings.spin = total;
    this.buildings.update(dt);
    this.cityLights.spin = total;
    this.cityLights.update(dt, elapsed);

    if (this.focusBase) {
      this.focusRotated.copy(this.focusBase).applyAxisAngle(Y_AXIS, total);
      this.morph.setFocus(this.focusRotated);
    }

    this.starfield.update(dt, elapsed);
    this.nebula.update(dt, elapsed);
    this.morph.update(dt, elapsed);
    this.shell.update(dt);
  }

  dispose(): void {
    this.starfield?.dispose();
    this.nebula?.dispose();
    this.morph?.dispose();
    this.buildings?.dispose();
    this.cityLights?.dispose();
    this.shell?.dispose();
    this.curl.dispose();
  }
}
