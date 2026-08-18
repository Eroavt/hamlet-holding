import gsap from 'gsap';
import { Vector3 } from 'three';

import { Ticker } from './Ticker';
import { Viewport } from './Viewport';
import { Quality } from './Quality';
import { StageMachine } from './StageMachine';
import { Router } from './Router';

import { Renderer } from '@/gl/Renderer';
import { Camera } from '@/gl/Camera';
import { Postprocessing } from '@/gl/Postprocessing';
import { World } from '@/gl/World';

import { Logo } from '@/ui/Logo';
import { Hotspots, type Projector } from '@/ui/Hotspots';
import { Cursor } from '@/ui/Cursor';
import { DetailPanel } from '@/ui/DetailPanel';
import { LangSwitch } from '@/ui/LangSwitch';
import { Legal } from '@/ui/Legal';
import { GlobeSwipe } from '@/ui/GlobeSwipe';
import { Kpis } from '@/ui/Kpis';

import { DIVISIONS, divisionBySlug, type Division } from '@/content/divisions';
import { detectLang, dict, rememberLang, type Dictionary, type Lang } from '@/content/i18n';

const COLLAPSE = 2.6;
/** Must match `#detail { top }` in ui.css — the placement solves against it. */
const DETAIL_TOP = 0.16;

/**
 * Playback rate of the descent, applied to the whole timeline rather than to
 * the individual tweens — the internal offsets stay in proportion, so pacing
 * is one number instead of eight.
 *
 * Deliberately asymmetric: arriving is the moment worth stretching, leaving
 * should get out of the way.
 */
const DETAIL_IN_PACE = 0.66;
const DETAIL_OUT_PACE = 0.88;

export class App {
  private ticker = new Ticker();
  private viewport = new Viewport();
  private stage = new StageMachine();
  private router = new Router();

  private renderer!: Renderer;
  private camera = new Camera();
  private post!: Postprocessing;
  /** Exposed for the dev inspector; nothing outside App writes to it. */
  world!: World;
  private quality!: Quality;

  private logo!: Logo;
  private hotspots!: Hotspots;
  private detail!: DetailPanel;
  private swipe!: GlobeSwipe;
  /** Aim value the current division settled on, to spring back to. */
  private aimAnchor = 0;
  private langSwitch!: LangSwitch;
  private legal!: Legal;
  private kpis!: Kpis;

  private lang: Lang = 'en';
  private copy!: Dictionary;

  private topbar = document.getElementById('lang')!;
  private footer = document.getElementById('footer')!;
  private footerLegal = document.getElementById('footer-legal')!;
  private partnerLabel = document.getElementById('footer-partner-label')!;
  private bootEl = document.getElementById('boot')!;

  private centre = { x: 0, y: 0 };
  private tmpA = new Vector3();
  private tmpB = new Vector3();
  private lastRadius = -1;
  private lastCx = -1;
  private lastCy = -1;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  async start(): Promise<void> {
    const canvas = document.getElementById('gl') as HTMLCanvasElement;

    try {
      this.renderer = new Renderer(canvas, this.viewport);
    } catch {
      return this.fail();
    }
    if (!this.renderer.supported) return this.fail();

    this.camera.fit(this.viewport.width, this.viewport.height);
    this.quality = new Quality(this.ticker, this.viewport);
    this.post = new Postprocessing(
      this.renderer.gl,
      this.renderer.scene,
      this.camera.cam,
      this.viewport.width,
      this.viewport.height,
      this.viewport.dpr,
    );

    this.buildUi();
    this.world = new World(this.renderer, this.camera, this.quality.settings);

    try {
      await this.world.load(() => {});
    } catch (err) {
      console.error(err);
      return this.fail();
    }

    this.world.resize(
      this.viewport.width,
      this.viewport.height,
      this.viewport.dpr,
      this.camera.cam.fov,
      this.viewport.aspect,
    );

    this.bind();
    this.ticker.add(this.frame);
    this.ticker.start();

    // A statutory page opened directly has to actually show it — see Router.
    const legal = this.router.readLegal();
    if (legal) this.legal.open(legal, true);

    const deepLink = this.router.read();
    if (deepLink && divisionBySlug(deepLink)) this.coldStartAtDivision(divisionBySlug(deepLink)!);
    else this.openUniverse();

    if (import.meta.env.DEV) {
      this.mountDebug();
      this.mountCaptureApi();
    }
  }

  /* ------------------------------------------------------------------ ui */

  private buildUi(): void {
    this.lang = detectLang();
    this.copy = dict(this.lang);
    document.documentElement.lang = this.lang;

    this.logo = new Logo();
    this.hotspots = new Hotspots();
    this.detail = new DetailPanel();
    this.langSwitch = new LangSwitch();
    this.legal = new Legal();
    this.kpis = new Kpis();
    this.swipe = new GlobeSwipe(document.getElementById('gl') as HTMLCanvasElement);

    // Turning the globe in the detail view walks through the divisions.
    this.swipe.canStart = () => this.stage.stage === 'detail' && !this.stage.busy;
    this.swipe.onDrag = (rad) => this.world.setAim(this.aimAnchor + rad);
    this.swipe.onCancel = () => this.world.aimTo(this.aimAnchor);
    this.swipe.onCommit = (dir) => this.stepDivision(dir);

    new Cursor();

    this.langSwitch.setActive(this.lang);
    this.applyCopy();

    this.logo.onActivate = () => this.onLogo();
    this.hotspots.onSelect = (d) => this.select(d);
    this.hotspots.onFocus = (dir) => this.world?.setFocus(dir);
    this.langSwitch.onChange = (l) => this.setLang(l);
    this.kpis.onSignature = () => this.revelation();

    this.logo.measure();
    this.logo.place(0);
  }

  private applyCopy(): void {
    this.hotspots.setCopy(this.copy);
    this.footerLegal.textContent = this.copy.company;
    this.partnerLabel.textContent = this.copy.partnerLabel;
    this.legal.setCopy(this.copy);
    this.kpis.setCopy(this.copy);
    this.refreshLogoLabel();

    const slug = this.router.read();
    const d = slug ? divisionBySlug(slug) : undefined;
    if (d) this.detail.fill(d, this.copy);

    // Label lengths differ per language, which changes the block's height.
    this.syncFooterHeight();
  }

  /**
   * Publishes the footer's measured height so the detail-view icon rail can
   * sit above it. The block wraps differently by language and viewport, so a
   * hard-coded offset collides with the partner endorsement on one of them.
   */
  private syncFooterHeight(): void {
    const h = Math.round(this.footer.getBoundingClientRect().height);
    if (h > 0) document.documentElement.style.setProperty('--footer-h', `${h}px`);

    // The globe has to be sized and centred against the space left above the
    // bottom chrome, or the lower marker ring lands on top of it.
    const reserve = h + Math.round(this.kpis.el.getBoundingClientRect().height);
    if (reserve !== this.camera.bottomReserve) {
      this.camera.bottomReserve = reserve;
      this.camera.fit(this.viewport.width, this.viewport.height);
      this.lastRadius = this.lastCx = this.lastCy = -1;
    }
  }

  /**
   * The mark changes job three times: it is the way in, then the brand, then
   * the way back. Assistive tech has to be told, and it must not advertise a
   * "back" action on the overview, where clicking it does nothing.
   */
  private refreshLogoLabel(): void {
    const stage = this.stage.stage;
    const idle = stage === 'boot' || stage === 'universe';
    this.logo.setLabel(
      idle ? this.copy.enterLabel : stage === 'detail' ? this.copy.backLabel : this.copy.brand,
    );
    this.logo.el.setAttribute('aria-disabled', String(stage === 'select'));
  }

  private setLang(lang: Lang): void {
    this.lang = lang;
    this.copy = dict(lang);
    document.documentElement.lang = lang;
    rememberLang(lang);
    this.applyCopy();
  }

  /* -------------------------------------------------------------- stages */

  private openUniverse(): void {
    this.stage.reset('universe');
    this.refreshLogoLabel();

    gsap.set(this.world.morph, { progress: 0 });
    gsap.set(this.world.shell, { reveal: 0 });
    gsap.set(this.world.buildings, { reveal: 0 });
    gsap.set(this.world.cityLights, { opacity: 0 });

    const tl = gsap.timeline();
    tl.to(this.world.starfield, { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0);
    // Shooting stars belong to the waiting sky. They come up a beat after the
    // field so the first thing seen is stillness, not motion.
    tl.to(this.world.meteors, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0.9);
    tl.to(this.world.nebula, { intensity: 0.5, duration: 2.0, ease: 'power2.out' }, 0);
    tl.add(() => this.dismissBoot(), 0.15);
    tl.add(() => this.logo.awaken(), 0.7);
  }

  private dismissBoot(): void {
    this.bootEl.classList.add('is-done');
    setTimeout(() => this.bootEl.remove(), 800);
  }

  private onLogo(): void {
    if (this.stage.stage === 'universe') this.enter();
    else if (this.stage.stage === 'detail') this.back();
  }

  /**
   * Act II. One timeline drives uProgress from 0 to 1; everything else —
   * camera, bloom, the mark's flight, the wireframe — hangs off the same
   * clock, which is why the phases stay locked together on any frame rate.
   */
  private enter(): void {
    if (!this.stage.go('collapse')) return;
    this.stage.busy = true;
    this.logo.settle();
    this.logo.el.style.pointerEvents = 'none';

    if (this.reduced) return this.enterInstantly();

    const tl = gsap.timeline({
      onComplete: () => {
        this.stage.busy = false;
        this.stage.go('select');
        this.logo.el.style.pointerEvents = '';
        this.refreshLogoLabel();
        this.hotspots.setEnabled(true);
      },
    });

    // ---- the particles -----------------------------------------------------
    tl.to(this.world.morph, { progress: 1, duration: COLLAPSE, ease: 'none' }, 0);
    tl.fromTo(
      this.world.morph,
      { burst: 0.9 },
      { burst: 1.7, duration: COLLAPSE * 0.5, ease: 'power2.out' },
      0,
    );

    // ---- inhale, then release ---------------------------------------------
    tl.to(this.camera, { dolly: 0.93, duration: 0.62, ease: 'power2.in' }, 0);
    tl.to(this.camera, { dolly: 1, duration: 1.95, ease: 'power2.out' }, 0.62);

    // ---- the detonation: bloom and aberration peak with the bell curve -----
    tl.to(this.post, { bloomStrength: 1.2, duration: 0.85, ease: 'power2.out' }, 0.05);
    tl.to(this.post, { bloomStrength: 0.62, duration: 1.5, ease: 'power2.inOut' }, 0.95);
    tl.to(this.post, { aberration: 0.0026, duration: 0.7, ease: 'power2.out' }, 0.1);
    tl.to(this.post, { aberration: 0.0004, duration: 1.4, ease: 'power2.inOut' }, 0.9);

    // ---- the mark flies to its header slot --------------------------------
    tl.to(this.logo, { t: 1, duration: 1.15, ease: 'power3.inOut' }, 0.18);

    // ---- crystallise -------------------------------------------------------
    tl.to(this.world.shell, { reveal: 1, duration: 0.95, ease: 'power2.out' }, 1.78);
    // The towers rise a beat after the mesh, so the sequence reads as ground
    // first, then what is built on it.
    tl.to(this.world.buildings, { reveal: 1, duration: 1.15, ease: 'power2.out' }, 1.95);
    // Last of all, the lights come on — the cities are the final thing the
    // planet tells you about itself.
    tl.to(this.world.cityLights, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 2.15);

    // ---- background settles ------------------------------------------------
    tl.to(this.world.starfield, { opacity: 0.72, duration: 1.3, ease: 'power2.out' }, 0.5);
    // Out with the detonation — a meteor crossing the finished globe would
    // read as a stray line, not as sky.
    // `overwrite` matters here: a click during the opening sequence leaves the
    // 2.2 s fade-in still running, and two live tweens on the same property
    // fight — the sky's meteors would come back up under the forming globe.
    tl.to(this.world.meteors, { opacity: 0, duration: 0.5, ease: 'power2.in', overwrite: 'auto' }, 0.1);
    tl.to(this.world.nebula, { intensity: 0.68, duration: 1.6, ease: 'power2.out' }, 0.5);

    // ---- UI, only once the GPU load is falling off -------------------------
    tl.add(this.hotspots.reveal(), 2.18);
    tl.to([this.topbar, this.footer, this.kpis.el], { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 2.3);
    // Starts with the fade rather than after it, so the figures are already
    // running by the time the band is legible. `call` rather than `add`: the
    // latter is for children, and a bare function handed to it does not get
    // scheduled reliably at a position.
    tl.call(() => this.kpis.countUp(), undefined, 2.3);
  }

  private enterInstantly(): void {
    gsap.set(this.world.morph, { progress: 1 });
    gsap.set(this.world.shell, { reveal: 1 });
    gsap.set(this.world.buildings, { reveal: 1 });
    gsap.set(this.world.cityLights, { opacity: 1 });
    this.world.starfield.opacity = 0.72;
    this.world.meteors.opacity = 0;
    this.world.nebula.intensity = 1;
    this.logo.place(1);
    gsap
      .timeline({
        onComplete: () => {
          this.stage.busy = false;
          this.stage.go('select');
          this.logo.el.style.pointerEvents = '';
          this.refreshLogoLabel();
          this.hotspots.setEnabled(true);
        },
      })
      .add(this.hotspots.reveal(true), 0)
      .to([this.topbar, this.footer, this.kpis.el], { opacity: 1, y: 0, duration: 0.25, ease: 'none' }, 0);
  }

  /** A shared link should honour the link, not force the ritual again. */
  private coldStartAtDivision(d: Division): void {
    this.stage.reset('select');
    gsap.set(this.world.morph, { progress: 1 });
    gsap.set(this.world.shell, { reveal: 1 });
    gsap.set(this.world.buildings, { reveal: 1 });
    gsap.set(this.world.cityLights, { opacity: 1 });
    this.world.starfield.opacity = 0.72;
    this.world.meteors.opacity = 0;
    this.world.nebula.intensity = 1;
    this.logo.place(1);
    this.refreshLogoLabel();
    gsap.set([this.topbar, this.footer, this.kpis.el], { opacity: 1, y: 0 });
    this.hotspots.reveal();
    this.dismissBoot();
    gsap.delayedCall(0.35, () => this.select(d, true));
  }

  /**
   * Moves to the neighbouring division, wrapping at both ends.
   *
   * `stage.go('detail')` is legal from 'detail', so this reuses select()
   * wholesale rather than duplicating the descent — the globe simply re-aims
   * and the panel re-fills.
   */
  private stepDivision(direction: 1 | -1): void {
    const slug = this.router.read();
    const here = DIVISIONS.findIndex((d) => d.slug === slug);
    if (here < 0) return;
    const next = DIVISIONS[(here + direction + DIVISIONS.length) % DIVISIONS.length];
    this.swipe.setEnabled(false);
    this.select(next);
  }

  private select(d: Division, silent = false): void {
    if (!this.stage.go('detail')) return;
    this.stage.busy = true;
    this.swipe.setEnabled(false);
    if (!silent) this.router.go(d.slug);

    this.detail.fill(d, this.copy);
    this.refreshLogoLabel();
    this.world.setFocus(null);
    this.world.aimAt(this.hotspotDir(d));

    const tl = gsap.timeline({
      onComplete: () => {
        this.stage.busy = false;
        // Where a drag springs back to, captured once the globe has settled.
        this.aimAnchor = this.world.aim;
        this.swipe.setEnabled(true);
      },
    });
    tl.timeScale(DETAIL_IN_PACE);

    const fit = this.detailPlacement();

    tl.add(this.hotspots.toRail(), 0);
    // The figures belong to the overview. In the detail view the globe fills
    // the lower half and the band would sit on top of it.
    tl.to(this.kpis.el, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0);

    // Losing altitude: the globe swells and drops until only its upper cap is
    // in frame, so the division is read *from above the horizon* rather than
    // next to a floating object. This is also where the towers finally resolve.
    tl.to(
      this.world.root.position,
      { x: 0, y: -fit.drop, duration: 1.25, ease: 'power3.inOut' },
      0.05,
    );
    tl.to(
      this.world.root.scale,
      { x: fit.zoom, y: fit.zoom, z: fit.zoom, duration: 1.35, ease: 'power3.inOut' },
      0.05,
    );
    tl.to(this.world.buildings, { scale: fit.zoom, duration: 1.35, ease: 'power3.inOut' }, 0.05);

    tl.add(this.detail.show(), 0.62);
  }

  private back(): void {
    if (this.stage.stage !== 'detail' || this.stage.busy) return;
    this.stage.busy = true;
    this.swipe.setEnabled(false);
    this.router.go(null);
    this.world.releaseAim();

    const tl = gsap.timeline({
      onComplete: () => {
        this.stage.busy = false;
        this.stage.reset('select');
        this.refreshLogoLabel();
      },
    });
    tl.timeScale(DETAIL_OUT_PACE);
    tl.add(this.detail.hide(), 0);
    tl.to(this.kpis.el, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.3);
    tl.call(() => this.kpis.countUp(), undefined, 0.3);
    tl.to(this.world.root.position, { x: 0, y: 0, duration: 1.0, ease: 'power3.inOut' }, 0.1);
    tl.to(this.world.root.scale, { x: 1, y: 1, z: 1, duration: 1.0, ease: 'power3.inOut' }, 0.1);
    tl.to(this.world.buildings, { scale: 1, duration: 1.0, ease: 'power3.inOut' }, 0.1);
    tl.add(this.hotspots.restore(), 0.4);
  }

  /**
   * The signature sequence, reached by clicking the figure in "our key
   * figures over the past 7 years": the world is drawn into a vortex, that
   * detonates, and the same particles settle into a line of text hanging in
   * the field.
   *
   * Deliberately outside the StageMachine. It is not a place you can navigate
   * to, it has no URL and nothing else in the app needs to reason about it —
   * routing it through the stage graph would put a hidden state into every
   * transition guard for no gain. A single flag and a stored snapshot of what
   * the screen looked like is enough to get back.
   */
  private revealing = false;
  private revealHint: HTMLElement | null = null;
  /** Aberration to put back afterwards; the sequence runs with none. */
  private abRest = 0;

  private revelation(): void {
    if (this.revealing || !this.world?.morph) return;
    this.revealing = true;
    this.swipe.setEnabled(false);
    this.hotspots.el.style.pointerEvents = 'none';

    const chrome = [this.topbar, this.footer, this.kpis.el, this.hotspots.el, this.hotspots.svg];
    const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });

    tl.to([...chrome, this.logo.el, this.detail.el], { opacity: 0, duration: 0.5, ease: 'power2.in' }, 0);
    // The globe's furniture goes with the blast rather than before it, so the
    // last thing standing is the point cloud that becomes the letters.
    tl.to(this.world.shell, { reveal: 0, duration: 0.75, ease: 'power2.in' }, 0.32);
    tl.to(this.world.buildings, { reveal: 0, duration: 0.7, ease: 'power2.in' }, 0.32);
    tl.to(this.world.cityLights, { opacity: 0, duration: 0.6, ease: 'power2.in' }, 0.32);

    // One parameter, three stations: 0 → 0.30 draws the globe out into the
    // turning disc, 0.30 → 0.76 detonates it, 0.60 → 1 gathers the letters.
    // Linear on purpose — the shader already eases each leg, and easing the
    // driver on top of that would stall the vortex and rush the blast.
    tl.to(this.world.morph, { word: 1, duration: 7.2, ease: 'none' }, 0.3);
    tl.to(this.world.morph, { haloOpacity: 1, duration: 1.2 }, 0.3);

    // The event horizon, held open only for as long as the vortex turns.
    tl.to(this.world.void_, { opacity: 1, duration: 1.1, ease: 'power2.out' }, 1.1);
    tl.to(this.world.void_, { opacity: 0, duration: 0.55, ease: 'power2.in' }, 2.9);

    // ---- the camera ---------------------------------------------------------
    // Drawn towards the hole while it turns, thrown back by the blast, then
    // settled. Without this the whole sequence happens to a viewer who never
    // moves, and a vortex you are not falling into is only a picture of one.
    tl.to(this.camera, { dolly: 0.74, duration: 3.0, ease: 'power2.in' }, 0.3);
    tl.to(this.camera, { dolly: 1.16, duration: 1.1, ease: 'power3.out' }, 3.3);
    tl.to(this.camera, { dolly: 1, duration: 2.6, ease: 'power2.inOut' }, 4.6);
    tl.to(this.camera, { roll: -0.16, duration: 3.2, ease: 'power2.inOut' }, 0.3);
    tl.to(this.camera, { roll: 0, duration: 3.0, ease: 'power2.inOut' }, 3.9);

    // ---- the flash ----------------------------------------------------------
    // Skipped outright when the reader has asked for less motion; a
    // full-screen white frame is the one thing here that could actually hurt.
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const flash = document.getElementById('flash');
      if (flash) {
        tl.to(flash, { opacity: 0.62, duration: 0.16, ease: 'power2.out' }, 3.32);
        tl.to(flash, { opacity: 0, duration: 0.9, ease: 'power2.in' }, 3.5);
      }
    }

    // Bloom carries the flash. It spikes with the shockwave — around word 0.53,
    // which lands near four and a half seconds in — and comes back down as the
    // letters draw themselves out of it.
    tl.to(this.post, { bloomStrength: 2.1, duration: 1.1, ease: 'power2.out' }, 3.2);
    tl.to(this.post, { bloomStrength: 0.7, duration: 2.2, ease: 'power2.inOut' }, 4.7);
    // Aberration is switched off for the whole sequence rather than spiked.
    // It samples red outwards and blue inwards, so every hard highlight gets a
    // red fringe on one side and a cyan one on the other — measurable at the
    // resting value alone, and this has to stay inside one family of blues.
    // Bloom carries the flash on its own.
    this.abRest = this.post.aberration;
    tl.to(this.post, { aberration: 0, duration: 0.6, ease: 'power2.out' }, 0);
    // And a hard clamp on top, from the first frame. The aberration was the
    // loud source of colour but not the only one — the night-side window
    // glow is warm amber and is still fading out a second in. Set instantly
    // rather than tweened: a ramp would let that second through.
    tl.set(this.post, { blueOnly: 1 }, 0);
    tl.to(this.world.starfield, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 5.0);
    tl.to(this.world.meteors, { opacity: 1, duration: 1.8, ease: 'power2.out' }, 6.2);

    tl.call(() => this.armDismiss(), undefined, 6.6);
  }

  /**
   * A hidden screen with no way out is a trap, so a faint line offers the way
   * back once the words have settled. It reuses the existing "back" string
   * rather than adding a fifth thing to translate.
   */
  private armDismiss(): void {
    if (!this.revealHint) {
      const el = document.createElement('p');
      el.id = 'reveal-hint';
      document.body.append(el);
      this.revealHint = el;
    }
    this.revealHint.textContent = this.copy.backLabel;
    gsap.fromTo(this.revealHint, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'power2.out' });

    const off = (): void => {
      window.removeEventListener('pointerdown', off);
      window.removeEventListener('keydown', onKey);
      this.endRevelation();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') off();
    };
    window.addEventListener('pointerdown', off);
    window.addEventListener('keydown', onKey);
  }

  private endRevelation(): void {
    if (!this.revealing) return;
    this.revealing = false;

    const detail = this.stage.stage === 'detail';
    const chrome = [this.topbar, this.footer, this.kpis.el, this.hotspots.el, this.hotspots.svg];
    const tl = gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        this.hotspots.el.style.pointerEvents = '';
        this.swipe.setEnabled(detail);
      },
    });

    if (this.revealHint) tl.to(this.revealHint, { opacity: 0, duration: 0.4 }, 0);
    tl.to(this.world.void_, { opacity: 0, duration: 0.3 }, 0);
    tl.to(this.camera, { dolly: 1, roll: 0, duration: 1.8, ease: 'power2.inOut' }, 0);
    tl.to(this.world.morph, { word: 0, duration: 2.6, ease: 'power2.inOut' }, 0);
    tl.to(this.post, { bloomStrength: 0.62, duration: 1.4, ease: 'power2.inOut' }, 0);
    tl.to(this.post, { aberration: this.abRest, duration: 1.4, ease: 'power2.inOut' }, 0.6);
    // Released only once the globe's own colour is back, or the city lights
    // would warm up again while the letters are still on screen.
    tl.to(this.post, { blueOnly: 0, duration: 1.0, ease: 'power2.inOut' }, 1.3);
    tl.to(this.world.shell, { reveal: 1, duration: 1.1, ease: 'power2.out' }, 1.1);
    tl.to(this.world.buildings, { reveal: 1, duration: 1.0, ease: 'power2.out' }, 1.1);
    tl.to(this.world.cityLights, { opacity: 1, duration: 0.9, ease: 'power2.out' }, 1.2);
    tl.to([this.logo.el, ...chrome], { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.4);
    // The partner endorsement belongs to the overview only — restoring it in
    // the detail view would undo what select() deliberately hides.
    if (detail) tl.to([this.kpis.el, this.hotspots.el], { opacity: 0, duration: 0.01 }, 1.4);
    if (detail) tl.to(this.detail.el, { opacity: 1, duration: 0.7, ease: 'power2.out' }, 1.4);
  }

  /**
   * Screen position of a point given in the globe's local space, plus whether
   * it is on the near side. The nodes need both every frame.
   */
  private projectNode: Projector = (point, out) => {
    this.tmpA.copy(point).multiply(this.world.root.scale).add(this.world.root.position);
    this.camera.project(this.tmpA, this.viewport.width, this.viewport.height, out);
    // Outward normal at the surface point vs. the direction to the camera.
    this.tmpB.copy(this.tmpA).sub(this.world.root.position).normalize();
    this.tmpA.subVectors(this.camera.cam.position, this.tmpA);
    return this.tmpB.dot(this.tmpA);
  };

  private hotspotDir(d: Division): Vector3 {
    const phi = ((90 - d.lat) * Math.PI) / 180;
    const theta = ((d.lon + 180) * Math.PI) / 180;
    const s = Math.sin(phi);
    return new Vector3(-s * Math.cos(theta), Math.cos(phi), s * Math.sin(theta));
  }

  /* ------------------------------------------------------------- plumbing */

  private bind(): void {
    this.viewport.on('resize', ({ width, height, dpr }) => {
      this.renderer.resize(width, height, dpr);
      this.camera.fit(width, height);
      this.post.resize(width, height, dpr);
      this.world.resize(width, height, dpr, this.camera.cam.fov, width / Math.max(height, 1));
      this.logo.measure();
      this.syncFooterHeight();
      // The detail placement is solved against the window, so a resize while a
      // division is open has to re-solve it or the globe keeps the old fit.
      if (this.stage.stage === 'detail' && !this.stage.busy) {
        const fit = this.detailPlacement();
        gsap.set(this.world.root.position, { y: -fit.drop });
        gsap.set(this.world.root.scale, { x: fit.zoom, y: fit.zoom, z: fit.zoom });
        this.world.buildings.scale = fit.zoom;
      }
      this.lastRadius = this.lastCx = this.lastCy = -1;
    });

    this.quality.onChange = (s) => {
      // Only the pixel ratio is cheap to change live; particle counts stay put
      // so no buffer is ever reallocated mid-session.
      this.world.setDpr(this.viewport.dpr);
      console.info(`[quality] now ${s.tier}`);
    };

    window.addEventListener(
      'pointermove',
      (e) => {
        const nx = (e.clientX / this.viewport.width) * 2 - 1;
        const ny = -((e.clientY / this.viewport.height) * 2 - 1);
        this.camera.setPointer(nx, ny);
      },
      { passive: true },
    );

    this.legal.onRoute = (page) => this.router.goLegal(page);
    this.router.on('legal', ({ page }) => {
      if (page) this.legal.open(page, true);
      else this.legal.hide(true);
    });

    this.router.on('route', ({ slug, initial }) => {
      if (initial) return;
      const d = slug ? divisionBySlug(slug) : undefined;
      if (d && this.stage.stage !== 'detail') this.select(d, true);
      else if (!slug && this.stage.stage === 'detail') this.back();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.stage.stage === 'detail') this.back();
    });

    this.hotspots.setEnabled(false);
  }

  private frame = (dt: number, elapsed: number): void => {
    this.camera.update(dt);
    this.world.update(dt, elapsed);
    this.syncStageMetrics();
    this.hotspots.update(this.projectNode, this.world.totalSpin, this.camera.globeRadiusPx);
    this.post.render(elapsed);
    if (this.pendingGrab) {
      const grab = this.pendingGrab;
      this.pendingGrab = null;
      grab();
    }
  };

  /**
   * Where the globe sits while a division is open, and how big it gets.
   *
   * Solved per viewport rather than fixed, because the two demands on it
   * fight. The sphere has to clear the copy above it AND show its whole disc,
   * and the space between the two is entirely a function of the window: at a
   * constant drop and zoom one of them always gives way. Measured at
   * 1280 x 800 with the old constants, the lower limb was cut off by 31 px.
   */
  private detailPlacement(): { drop: number; zoom: number } {
    const { width, height } = this.viewport;

    // The panel is laid out even while it is still transparent, so its height
    // is honest before the transition has run.
    const panel = this.detail.el.getBoundingClientRect().height;
    const textBottom = height * DETAIL_TOP + (panel || height * 0.26);
    // Generous, because the panel may still be display:none when this is
    // solved and the fallback height is an estimate. Erring small here shows
    // up directly as the sphere crowding the copy.
    const gap = Math.max(38, height * 0.055);
    const foot = Math.max(22, height * 0.032);

    // Never smaller than it already is on the overview — the descent has to
    // read as coming closer, whatever the arithmetic says.
    const band = height - foot - textBottom - gap;
    const rPx = Math.max(this.camera.globeRadiusPx, Math.min(band / 2, width * 0.34));
    const zoom = rPx / this.camera.globeRadiusPx;

    // One world unit subtends exactly globeRadiusPx pixels at this depth,
    // since the globe is a unit sphere — which is what makes the conversion
    // below a division rather than a second projection.
    this.tmpA.set(0, 0, 0);
    this.camera.project(this.tmpA, width, height, this.centre);
    const drop = (textBottom + gap + rPx - this.centre.y) / this.camera.globeRadiusPx;

    return { drop, zoom };
  }

  /** Dev-only: runs immediately after a render, while the buffer is still valid. */
  private pendingGrab: (() => void) | null = null;

  /**
   * Publishes the globe's projected geometry to CSS so the tiles orbit it
   * exactly, at any viewport. Guarded on a real change — writing custom
   * properties every frame would invalidate style for the whole subtree.
   */
  private syncStageMetrics(): void {
    const { width, height } = this.viewport;
    this.camera.project(this.world.root.position, width, height, this.centre);
    const radius = this.camera.globeRadiusPx * this.world.root.scale.x;

    // A single bad frame must not get latched in: bail on NaN rather than
    // writing it, and re-check on the next frame.
    if (!Number.isFinite(radius) || !Number.isFinite(this.centre.x) || !Number.isFinite(this.centre.y)) {
      return;
    }

    // The centre moves independently of the radius (camera parallax, and the
    // detail view sliding the globe aside), so both have to be in the guard.
    if (
      Math.abs(radius - this.lastRadius) < 0.3 &&
      Math.abs(this.centre.x - this.lastCx) < 0.3 &&
      Math.abs(this.centre.y - this.lastCy) < 0.3
    ) {
      return;
    }
    this.lastRadius = radius;
    this.lastCx = this.centre.x;
    this.lastCy = this.centre.y;

    const s = document.documentElement.style;
    s.setProperty('--globe-radius', `${radius.toFixed(1)}px`);
    s.setProperty('--stage-cx', `${this.centre.x.toFixed(1)}px`);
    s.setProperty('--stage-cy', `${this.centre.y.toFixed(1)}px`);
  }

  private fail(): void {
    this.bootEl.remove();
    document.getElementById('ui')?.remove();
    document.getElementById('unsupported')?.removeAttribute('hidden');
  }

  /* ---------------------------------------------------------------- debug */

  private mountDebug(): void {
    const panel = document.createElement('div');
    panel.style.cssText =
      'position:fixed;left:12px;bottom:12px;z-index:999;font:11px/1.6 ui-monospace,monospace;' +
      'color:#7fe;background:rgba(0,0,0,.72);border:1px solid rgba(127,238,255,.25);' +
      'padding:10px 12px;border-radius:8px;pointer-events:auto;display:none;min-width:190px';
    panel.innerHTML = `
      <div id="dbg-fps"></div>
      <div>particles ${this.quality.settings.particles.toLocaleString()} · ${this.quality.settings.tier}</div>
      <label style="display:block;margin-top:8px">progress <span id="dbg-val">0.00</span>
        <input id="dbg-progress" type="range" min="0" max="1" step="0.001" value="0" style="width:100%">
      </label>`;
    document.body.append(panel);

    const fps = panel.querySelector<HTMLElement>('#dbg-fps')!;
    const range = panel.querySelector<HTMLInputElement>('#dbg-progress')!;
    const val = panel.querySelector<HTMLElement>('#dbg-val')!;

    range.addEventListener('input', () => {
      const v = Number(range.value);
      val.textContent = v.toFixed(2);
      gsap.killTweensOf(this.world.morph);
      gsap.killTweensOf(this.world.shell);
      this.world.morph.progress = v;
      this.world.shell.reveal = Math.max(0, (v - 0.68) / 0.32);
      this.logo.place(Math.min(1, Math.max(0, (v - 0.07) / 0.37)));
    });

    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey) return;
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });

    this.ticker.add(() => {
      fps.textContent = `${this.ticker.fps.toFixed(0)} fps · ${this.renderer.gl.info.render.calls} calls`;
    });

    console.info('[debug] press D for the inspector');
  }

  /**
   * Dev-only bridge for reviewing WebGL states outside the browser. Pairs with
   * scripts/vite-plugin-capture.mjs; stripped from production builds.
   */
  private mountCaptureApi(): void {
    const api = {
      app: this,
      /** Freeze the experience at an arbitrary point on the collapse. */
      set: (progress: number, revealFrom = 0.68) => {
        gsap.globalTimeline.clear();
        gsap.killTweensOf([this.world.morph, this.world.shell, this.logo, this.camera, this.post]);
        this.world.morph.progress = progress;
        this.world.shell.reveal = gsap.utils.clamp(0, 1, (progress - revealFrom) / (1 - revealFrom));
        this.world.buildings.reveal = gsap.utils.clamp(0, 1, (progress - 0.74) / 0.26);
        this.world.cityLights.opacity = gsap.utils.clamp(0, 1, (progress - 0.8) / 0.2);
        this.world.starfield.opacity = gsap.utils.mapRange(0, 1, 1, 0.72, progress);
        this.world.nebula.intensity = gsap.utils.mapRange(0, 1, 0.5, 0.68, progress);
        this.post.bloomStrength = 0.6 + Math.sin(progress * Math.PI) * 0.75;
        this.logo.place(gsap.utils.clamp(0, 1, (progress - 0.07) / 0.37));
        return progress;
      },
      capture: async (name: string) => {
        // Read back inside the render loop, right after post.render(). Grabbing
        // asynchronously races the compositor and intermittently returns an
        // already-cleared (fully transparent) buffer. Downscaling keeps
        // toDataURL off the ~800 ms path so it cannot skew timing measurements.
        const dataUrl = await new Promise<string>((resolve) => {
          this.pendingGrab = () => {
            const src = this.renderer.gl.domElement;
            const w = Math.min(960, src.width);
            const h = Math.round((src.height / src.width) * w);
            const scratch = document.createElement('canvas');
            scratch.width = w;
            scratch.height = h;
            const ctx = scratch.getContext('2d', { alpha: false })!;
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(src, 0, 0, w, h);
            resolve(scratch.toDataURL('image/png'));
          };
          // While the page is hidden the render loop is stopped, so nothing
          // would ever service the grab. Drive exactly one frame by hand.
          if (document.hidden) this.ticker.pump(1 / 60);
        });
        const res = await fetch('/__capture', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, dataUrl }),
        });
        return res.json();
      },
      /** Steps the collapse and captures each stop in one go. */
      sweep: async (stops: number[]) => {
        const out: string[] = [];
        for (const p of stops) {
          api.set(p);
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          await api.capture(`p${p.toFixed(2).replace('.', '_')}`);
          out.push(p.toFixed(2));
        }
        return out;
      },
      /**
       * Canvas *and* DOM in one image. The WebGL buffer alone says nothing
       * about the typography and the marker nodes, and the preview pane is
       * not always compositing. Rasterises the overlay through an SVG
       * foreignObject with the page's own stylesheets inlined.
       */
      captureComposite: async (name: string) => {
        const w = this.viewport.width;
        const h = this.viewport.height;

        const css = Array.from(document.styleSheets)
          .flatMap((sheet) => {
            try {
              return Array.from(sheet.cssRules).map((r) => r.cssText);
            } catch {
              return [];
            }
          })
          .join('\n');

        // foreignObject content has to be well-formed XML — outerHTML is not
        // (void elements stay unclosed), which silently breaks the image.
        const ser = new XMLSerializer();
        const xml = (id: string): string => {
          const node = document.getElementById(id);
          if (!node || (node as HTMLElement).hidden) return '';
          // A scrolled container serialises at scrollTop 0, so the captured
          // image would always show the top of the document. Shift the content
          // by the same amount to reproduce what is actually on screen.
          const clone = node.cloneNode(true) as HTMLElement;
          const src = node.querySelector('[id$="-body"]');
          const dst = clone.querySelector('[id$="-body"]') as HTMLElement | null;
          if (src && dst && src.scrollTop > 0) {
            dst.style.marginTop = `${-src.scrollTop}px`;
          }
          return ser.serializeToString(clone);
        };

        // The globe's projected geometry lives in custom properties written to
        // <html> every frame. The foreignObject wrapper is a fresh root and
        // inherits none of them, so without this the markers fall back to the
        // stylesheet defaults and the capture shows a layout the page never
        // had — which is worse than no capture at all.
        const runtimeVars = document.documentElement.getAttribute('style') ?? '';

        const svg =
          `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
          `<foreignObject width="100%" height="100%">` +
          `<div xmlns="http://www.w3.org/1999/xhtml" ` +
          `style="width:${w}px;height:${h}px;${runtimeVars}">` +
          `<style><![CDATA[${css}]]></style>${xml('nodes')}${xml('ui')}${xml('legal')}` +
          `</div></foreignObject></svg>`;

        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        await new Promise((res) => {
          img.onload = res;
          img.onerror = res;
        });

        const dataUrl = await new Promise<string>((resolve) => {
          this.pendingGrab = () => {
            const out = document.createElement('canvas');
            out.width = w;
            out.height = h;
            const ctx = out.getContext('2d', { alpha: false })!;
            ctx.fillStyle = '#010105';
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(this.renderer.gl.domElement, 0, 0, w, h);
            ctx.drawImage(img, 0, 0, w, h);
            resolve(out.toDataURL('image/png'));
          };
          if (document.hidden) this.ticker.pump(1 / 60);
        });

        const res = await fetch('/__capture', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name, dataUrl }),
        });
        return res.json();
      },
      /**
       * Advances GSAP and the render loop by hand, in 60 Hz slices. Both
       * clocks stop when the page is hidden, so without this an automated
       * check of a multi-second timeline simply never progresses.
       */
      step: (ms: number) => {
        const slice = 1 / 60;
        let t = gsap.globalTimeline.totalTime();
        const n = Math.max(1, Math.round(ms / 1000 / slice));
        for (let i = 0; i < n; i++) {
          t += slice;
          gsap.updateRoot(t);
          this.ticker.pump(slice);
        }
        return {
          stage: this.stage.stage,
          busy: this.stage.busy,
          path: window.location.pathname,
        };
      },
      /**
       * The real GSAP instance. `step()` drives the root timeline by hand, but
       * tweens created *during* that render take their start time from the
       * wall-clock ticker instead, so they read as already finished. Anything
       * that spawns tweens from a timeline callback has to be exercised
       * against this ticker to be tested honestly.
       */
      gsap,
      stats: () => ({
        fps: Number(this.ticker.fps.toFixed(1)),
        calls: this.renderer.gl.info.render.calls,
        points: this.renderer.gl.info.render.points,
        lines: this.renderer.gl.info.render.lines,
        tier: this.quality.settings.tier,
        particles: this.quality.settings.particles,
      }),
    };
    (window as unknown as { __hhg: typeof api }).__hhg = api;
    console.info('[debug] window.__hhg ready: set(p), capture(name), sweep([...]), stats()');
  }
}
