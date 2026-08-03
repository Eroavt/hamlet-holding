import { Emitter } from './Emitter';
import { DIVISIONS } from '@/content/divisions';

type Events = {
  /** null means "the selection screen". */
  route: { slug: string | null; initial: boolean };
};

const SLUGS = new Set(DIVISIONS.map((d) => d.slug));

/**
 * History-API routing so every division is shareable and the browser's back
 * button behaves. Static hosts need a rewrite of unknown paths to index.html
 * — see README.
 */
export class Router extends Emitter<Events> {
  /** Path the app is mounted under, e.g. "/" or "/hamlet/". */
  private base: string;

  constructor() {
    super();
    // Everything up to and including the final slash is the mount point; the
    // last segment is a route of ours only if it is a known slug.
    //
    // An *unknown* last segment must not be mistaken for a mount point. The
    // host rewrites every unmatched path to index.html, so the old reading
    // made /impressum the base and turned each subsequent division link into
    // /impressum/asset-management.
    const path = window.location.pathname;
    this.base = path.slice(0, path.lastIndexOf('/') + 1) || '/';

    window.addEventListener('popstate', this.onPop);
  }

  dispose(): void {
    window.removeEventListener('popstate', this.onPop);
    this.clear();
  }

  /** The slug encoded in the current URL, or null. */
  read(): string | null {
    const path = window.location.pathname;
    const last = path.slice(path.lastIndexOf('/') + 1);
    return SLUGS.has(last) ? last : null;
  }

  /** Announce the route the page was opened with. */
  boot(): void {
    this.emit('route', { slug: this.read(), initial: true });
  }

  /** Navigate, pushing a history entry. */
  go(slug: string | null): void {
    if (slug === this.read()) return;
    const url = slug ? this.base + slug : this.base;
    window.history.pushState({ slug }, '', url);
    this.emit('route', { slug, initial: false });
  }

  private onPop = (): void => {
    this.emit('route', { slug: this.read(), initial: false });
  };
}
