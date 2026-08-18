import gsap from 'gsap';
import { Group, Vector3, type Data3DTexture } from 'three';
import { Starfield } from './scenes/Starfield';
import { Void } from './scenes/Void';
import { Meteors } from './scenes/Meteors';
import { Nebula } from './scenes/Nebula';
import { Morph } from './scenes/Morph';
import { Buildings } from './scenes/Buildings';
import { CityLights } from './scenes/CityLights';
import { GlobeShell } from './scenes/GlobeShell';
import { DIVISIONS } from '@/content/divisions';
import { buildCurlTexture } from './data/curlField';
import { buildWordPoints } from './data/wordPoints';
import { buildIcoGraph } from './data/icoGraph';
import type { BuildRequest, BuildResult } from './data/landmask.worker';
import type { Renderer } from './Renderer';
import type { Camera } from './Camera';
import type { QualitySettings } from '@/core/Quality';

const GRID_W = 1024;
const GRID_H = 512;
const Y_AXIS = new Vector3(0, 1, 0);

/** The line the particles spell out when the founder's name is clicked. */
const WORD = 'GOD HAS A PLAN';
/** Event horizon radius as a share of half the frame width. Mirrors VOID_R in
 *  morph.glsl.ts — the two have to agree exactly or the disc shows a seam. */
const VOID_R = 0.23;

/**
 * The face the globe presents when it first forms — central Europe, where the
 * company operates from.
 *
 * Rotating a point p about Y by `a` gives z' = c·pz − s·px, which is greatest
 * at a = atan2(−px, pz); that is the angle bringing the point to face the
 * camera. Same relation `aimAt()` uses, evaluated once for the start value.
 */
const FIRST_FACE = { lat: 50, lon: 10 };

function spinFacing(latDeg: number, lonDeg: number): number {
  const phi = ((90 - latDeg) * Math.PI) / 180;
  const theta = ((lonDeg + 180) * Math.PI) / 180;
  const s = Math.sin(phi);
  const x = -s * Math.cos(theta);
  const z = s * Math.sin(theta);
  return Math.atan2(-x, z);
}

export class World {
  /** Holds everything that belongs to the globe, so the detail view can move
   *  the whole body without touching the camera or the background. */
  readonly root = new Group();

  starfield!: Starfield;
  void_!: Void;
  meteors!: Meteors;
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

  private spin = spinFacing(FIRST_FACE.lat, FIRST_FACE.lon);

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

    // Few on purpose, and fewer than that again. A streak has to read as luck
    // rather than as a meteor shower.
    this.meteors = new Meteors();
    this.layoutMeteors();
    this.renderer.scene.add(this.meteors.mesh);

    this.void_ = new Void();
    this.renderer.scene.add(this.void_.mesh);
    this.renderer.scene.add(this.root);
    onProgress(0.22);

    const data = await this.sample();
    onProgress(0.58);

    this.morph = new Morph(this.curl);
    // Baked at boot with everything else. It costs one canvas rasterisation
    // and stays in the same buffer as the globe, so the reveal is a uniform
    // sweep rather than an upload in the middle of an animation.
    this.morph.setData(
      data,
      this.quality.particles,
      buildWordPoints(WORD, this.quality.particles).data,
    );
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
    this.fitWord(this.camera.cam.fov, this.camera.cam.aspect);
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
    // The streaks are composed against the frame, and the viewing distance is
    // derived from the viewport — so the frame moving means recomposing.
    this.layoutMeteors();
    this.fitWord(fov, aspect);
  }

  /**
   * Sizes the whole reveal to the frame.
   *
   * Everything in it — the text, the galaxy's radii, the event horizon — is a
   * constant share of one number, so this is the entire responsiveness of the
   * sequence: half the world-space width the camera can see at the origin.
   * The vertical offset comes with it, because the globe is deliberately
   * lifted clear of the chrome and anything built around the world origin
   * would inherit that lift and sit high in the frame.
   */
  private fitWord(fov: number, aspect: number): void {
    const halfH = this.camera.distance * Math.tan((fov * Math.PI) / 360);
    const scale = halfH * aspect;
    this.morph.wordScale = scale;
    this.morph.wordY = this.camera.lookY;
    // Has to track the shader's VOID_R exactly, or the black disc either
    // leaves a rim of sky showing or eats the bright inner edge of the vortex.
    this.void_.radius = scale * VOID_R;
    this.void_.mesh.position.y = this.camera.lookY;
  }

  private layoutMeteors(): void {
    this.meteors.layout(
      this.camera.distance,
      this.camera.lookY,
      this.camera.cam.aspect,
      this.camera.cam.fov,
    );
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

  /**
   * Drives the aim directly, for a drag that should track the pointer.
   * Kills any running tween first — otherwise the tween keeps writing and the
   * globe fights the hand holding it.
   */
  setAim(value: number): void {
    gsap.killTweensOf(this);
    this.aim = value;
  }

  /** Eases the aim to an absolute value — used to spring back after a drag. */
  aimTo(value: number): void {
    gsap.to(this, { aim: value, duration: 0.6, ease: 'power3.out', overwrite: 'auto' });
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
    this.meteors.update(dt, elapsed);
    this.nebula.update(dt, elapsed);
    this.morph.update(dt, elapsed);
    this.shell.update(dt);
  }

  dispose(): void {
    this.starfield?.dispose();
    this.void_?.dispose();
    this.meteors?.dispose();
    this.nebula?.dispose();
    this.morph?.dispose();
    this.buildings?.dispose();
    this.cityLights?.dispose();
    this.shell?.dispose();
    this.curl.dispose();
  }
}
