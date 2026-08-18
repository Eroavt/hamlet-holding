import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  FrontSide,
  GLSL3,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import {
  LINES_VERT,
  LINES_FRAG,
  ATMO_VERT,
  ATMO_FRAG,
  GLOW_VERT,
  GLOW_FRAG,
} from '../shaders/scene.glsl';
import { buildOrbits, type IcoGraph } from '../data/icoGraph';

/**
 * Everything that turns the particle cloud into a *projection*.
 *
 * The brief is a hologram, not a model of the Earth, so this deliberately
 * avoids anything that reads as a solid body: the mesh is sparse and uneven,
 * the far hemisphere shows through, instrument rings orbit outside it, and a
 * band sweeps down the surface. The opaque core is small and very dark — just
 * enough to keep the additive particles on the far side from doubling up.
 */
export class GlobeShell {
  readonly lines: LineSegments;
  readonly orbits: LineSegments;
  readonly core: Mesh;
  readonly atmosphere: Mesh;
  readonly glow: Mesh;

  private linesMat: ShaderMaterial;
  private orbitsMat: ShaderMaterial;
  private atmoMat: ShaderMaterial;
  private glowMat: ShaderMaterial;
  private coreMat: MeshBasicMaterial;
  private _reveal = 0;
  private scan = 0;

  constructor(graph: IcoGraph) {
    /* ---- the network ---------------------------------------------------- */
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(graph.positions, 3));
    geo.setAttribute('aSeed', new BufferAttribute(graph.seeds, 1));
    geo.setAttribute('aLand', new BufferAttribute(graph.land, 1));

    this.linesMat = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: LINES_VERT,
      fragmentShader: LINES_FRAG,
      uniforms: {
        uDraw: { value: 0 },
        uSpin: { value: 0 },
        uOpacity: { value: 0.62 },
        uScan: { value: 2 },
        uColor: { value: new Color(0x5fd2ff) },
        uScanColor: { value: new Color(0xd8f6ff) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending,
    });

    this.lines = new LineSegments(geo, this.linesMat);
    this.lines.frustumCulled = false;
    this.lines.renderOrder = 2;
    this.lines.visible = false;

    /* ---- instrument rings ------------------------------------------------ */
    const orbitGeo = new BufferGeometry();
    const orbitPos = buildOrbits(3);
    orbitGeo.setAttribute('position', new BufferAttribute(orbitPos, 3));
    orbitGeo.setAttribute('aSeed', new BufferAttribute(new Float32Array(orbitPos.length / 3), 1));
    orbitGeo.setAttribute(
      'aLand',
      new BufferAttribute(new Float32Array(orbitPos.length / 3).fill(1), 1),
    );

    this.orbitsMat = this.linesMat.clone();
    this.orbitsMat.uniforms.uOpacity.value = 0.16;
    this.orbitsMat.uniforms.uColor.value = new Color(0x2e7fd0);

    this.orbits = new LineSegments(orbitGeo, this.orbitsMat);
    this.orbits.frustumCulled = false;
    this.orbits.renderOrder = 2;
    this.orbits.visible = false;

    /* ---- dark core ------------------------------------------------------- */
    this.coreMat = new MeshBasicMaterial({ color: new Color(0x02061a), side: FrontSide });
    this.core = new Mesh(new SphereGeometry(0.955, 40, 28), this.coreMat);
    this.core.renderOrder = 0;
    this.core.scale.setScalar(0.001);
    this.core.visible = false;

    /* ---- rim ------------------------------------------------------------- */
    this.atmoMat = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: ATMO_VERT,
      fragmentShader: ATMO_FRAG,
      uniforms: {
        uColor: { value: new Color(0x2ba8ff) },
        uOpacity: { value: 0 },
        uPower: { value: 3.8 },
      },
      transparent: true,
      depthWrite: false,
      side: BackSide,
      blending: AdditiveBlending,
    });

    this.atmosphere = new Mesh(new SphereGeometry(1.05, 44, 30), this.atmoMat);
    this.atmosphere.renderOrder = 3;
    this.atmosphere.visible = false;

    /* ---- the blue light behind it ------------------------------------------ */
    this.glowMat = new ShaderMaterial({
      glslVersion: GLSL3,
      vertexShader: GLOW_VERT,
      fragmentShader: GLOW_FRAG,
      uniforms: {
        uColor: { value: new Color(0x2e6fe0) },
        uOpacity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      // Depth-tested and parked behind the core, so it reads as a light
      // source the globe sits in front of rather than a bruise painted on it.
      depthTest: true,
      blending: AdditiveBlending,
    });

    this.glow = new Mesh(new PlaneGeometry(1, 1), this.glowMat);
    this.glow.scale.setScalar(1.9);
    this.glow.position.set(0, -0.62, -1.15);
    this.glow.frustumCulled = false;
    this.glow.renderOrder = -1;
    this.glow.visible = false;
  }

  /** 0 → nothing, 1 → fully crystallised. */
  set reveal(v: number) {
    this._reveal = v;
    const on = v > 0.001;
    this.lines.visible = on;
    this.orbits.visible = on;
    this.core.visible = on;
    this.atmosphere.visible = on;
    this.glow.visible = on;

    this.linesMat.uniforms.uDraw.value = v;
    this.linesMat.uniforms.uOpacity.value = 0.62 * Math.min(1, v * 1.4);
    this.orbitsMat.uniforms.uDraw.value = Math.max(0, v * 1.6 - 0.6);
    this.orbitsMat.uniforms.uOpacity.value = 0.16 * Math.min(1, v * 1.4);
    this.atmoMat.uniforms.uOpacity.value = 0.52 * v;
    this.glowMat.uniforms.uOpacity.value = 0.62 * v;

    // The core only starts writing depth once it is actually opaque, or it
    // would punch a black hole through the middle of the detonation.
    this.core.scale.setScalar(Math.max(0.001, v));
    this.coreMat.opacity = v;
    this.coreMat.transparent = v < 0.99;
    this.coreMat.depthWrite = v > 0.4;
  }

  get reveal(): number {
    return this._reveal;
  }

  set spin(v: number) {
    this.linesMat.uniforms.uSpin.value = v;
    this.core.rotation.y = v;
    this.atmosphere.rotation.y = v;
    // Rings turn the other way and slower — parallax between the two layers
    // is what sells the depth.
    this.orbitsMat.uniforms.uSpin.value = -v * 0.45;
  }

  update(dt: number): void {
    // 2 = parked outside the sphere, so nothing is lit between sweeps.
    this.scan += dt * 0.42;
    if (this.scan > 3.4) this.scan = -1.4;
    this.linesMat.uniforms.uScan.value = this.scan > 1.2 ? 9 : this.scan;
  }

  dispose(): void {
    this.lines.geometry.dispose();
    this.linesMat.dispose();
    this.orbits.geometry.dispose();
    this.orbitsMat.dispose();
    this.core.geometry.dispose();
    this.coreMat.dispose();
    this.atmosphere.geometry.dispose();
    this.atmoMat.dispose();
    this.glow.geometry.dispose();
    this.glowMat.dispose();
  }
}
