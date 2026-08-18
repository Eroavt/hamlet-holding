import { CircleGeometry, Mesh, MeshBasicMaterial } from 'three';

/**
 * The event horizon at the middle of the vortex.
 *
 * A genuinely opaque disc rather than an absence of particles. The vortex
 * already leaves its centre empty by construction, but the starfield and the
 * nebula sit behind it and would shine straight through the gap — and a hole
 * you can see stars inside is not a hole. This paints over them.
 *
 * Ordered between the background and the point cloud: after the sky so it can
 * cover it, before the particles so the rim still burns in front of it.
 */
export class Void {
  readonly mesh: Mesh;
  private material: MeshBasicMaterial;

  constructor() {
    this.material = new MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    });
    // Unit radius; the world scales it, so nothing is rebuilt when the
    // viewport changes.
    this.mesh = new Mesh(new CircleGeometry(1, 96), this.material);
    this.mesh.renderOrder = 0;
    this.mesh.visible = false;
  }

  /** Radius in world units. */
  set radius(v: number) {
    this.mesh.scale.setScalar(v);
  }

  set opacity(v: number) {
    this.material.opacity = v;
    this.mesh.visible = v > 0.002;
  }

  get opacity(): number {
    return this.material.opacity;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
