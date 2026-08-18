import { Emitter } from './Emitter';
import { DIVISIONS } from '@/content/divisions';

type Events = {
  /** null means "the selection screen". */
  route: { slug: string | null; initial: boolean };
  /** null means "no statutory page open". */
  legal: { page: 'imprint' | 'privacy' | null };
};

const SLUGS = new Set(DIVISIONS.map((d) => d.slug));

/**
 * The two statutory pages, which are real URLs and not only overlay states.
 *
 * A German company has to keep its imprint directly reachable, so a shared or
 * bookmarked /impressum must actually show the imprint. They also have to be
 * known here for a second reason: anything the router does not recognise is
 * treated as the mount point, so an unlisted /impressum would silently become
 * the base path and every division link after it would resolve under it.
 */
const LEGAL: Record<string, 'imprint' | 'privacy'> = {
  impressum: 'imprint',
  datenschutz: 'privacy',
};

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
    const path = window.location.pathname;
    const last = path.slice(path.lastIndexOf('/') + 1);
    // Anything after the final slash that is a known slug is *our* route,
    // everything before it is the mount point.
    const known = SLUGS.has(last) || last in LEGAL;
    this.base = known ? path.slice(0, path.lastIndexOf('/') + 1) : path;
    if (!this.base.endsWith('/')) this.base += '/';

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

  /** The legal page encoded in the current URL, or null. */
  readLegal(): 'imprint' | 'privacy' | null {
    const path = window.location.pathname;
    const last = path.slice(path.lastIndexOf('/') + 1);
    return LEGAL[last] ?? null;
  }

  /** Navigate to a statutory page, or back off it. */
  goLegal(page: 'imprint' | 'privacy' | null): void {
    const slug = page ? Object.keys(LEGAL).find((k) => LEGAL[k] === page)! : '';
    const url = this.base + slug;
    if (url === window.location.pathname) return;
    window.history.pushState({ legal: page }, '', url);
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
    this.emit('legal', { page: this.readLegal() });
    this.emit('route', { slug: this.read(), initial: false });
  };
}
