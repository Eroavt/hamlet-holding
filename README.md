# Hamlet Holding Group

An immersive one-page experience: a universe of stars collapses into a network
globe, from which the six business divisions emerge.

```bash
npm install
npm run dev      # http://127.0.0.1:5173
```

## The one thing to understand before changing anything

There is **one** WebGL canvas and **one** particle buffer for the whole site.
"Universe", "globe" and "detail" are not separate scenes — they are different
values of a single `uProgress` uniform on the same 240 000 particles.

Every particle carries two positions: where it rests in the cloud behind the
mark (`aStart`) and where it belongs on the globe (`position`). The shader
interpolates between them. Two details do the actual work
(`src/gl/shaders/morph.glsl.ts`):

1. a per-particle stagger biased by latitude, so the continents write
   themselves in from the north pole downwards rather than fizzing into place;
2. turbulence weighted by `sin(t·π)` — exactly zero at both ends of the
   journey, maximum mid-flight. That bell curve *is* the detonation.

Nothing is allocated, uploaded or compiled after boot. That is why the
transition cannot hitch, and it is the constraint to preserve.

## Layout

```
assets-source/     original artwork and reference recordings (not built)
public/brand/      transparent PNGs derived from the artwork
scripts/           asset pipeline + dev tooling
src/core/          Ticker, Viewport, Quality, StageMachine, Router, App
src/gl/            renderer, camera, post-processing, scenes, shaders, data
src/ui/            logo, hotspots, detail panel, cursor, language switch
src/content/       divisions.ts + en.json / de.json
src/styles/        tokens.css, base.css, ui.css
```

`src/core/App.ts` is the orchestrator: it owns the collapse timeline and is the
only place that knows about both the WebGL side and the DOM side.

## Content

- **Copy** lives in `src/content/en.json` and `src/content/de.json`. Keys must
  match the `id` of each entry in `src/content/divisions.ts`.
- **Division placement** around the globe is polar: `angle` in degrees from
  twelve o'clock, `dist` as a multiple of the globe's projected radius. Those
  numbers were measured off `assets-source/Webseite Langformat.jpeg`, so the
  composition holds at any viewport.
- **`lat` / `lon`** decide which region of the globe lights up on hover.
- **Icons** are inline SVG strokes in the same file.

## Brand assets

`npm run brand` re-derives `public/brand/*.png` and `public/og-image.jpg` from
`assets-source/Webseite Logo.jpeg`. The source is white on black, so luminance
is used directly as the alpha channel — no manual masking, and the antialiased
edges survive. Re-run it if the artwork changes.

## Geography

There is no Earth texture. `src/gl/data/worldLand.ts` holds simplified
coastlines as polygon rings; `rasterizeLand.ts` scanline-fills them into an
occupancy grid, and a web worker rejection-samples particle positions from it.
Resolution-independent, ~12 kB, no extra request.

Seas that would be sub-pixel at globe scale (Black Sea, Caspian, Persian Gulf,
Gulf of California) are deliberately filled. The Red Sea survives because
Africa and Eurasia are separate rings.

## Performance

- One `requestAnimationFrame` loop, in `src/core/Ticker.ts`. Do not add another.
- Quality tiers pick 45 000 / 120 000 / 240 000 particles from device hints,
  then step **down** if the frame rate cannot hold. Never up — switching costs
  a buffer rebuild.
- Bloom runs at half resolution.
- DOM animations are restricted to `transform`, `opacity` and `filter`.
- Measured on the development machine: median 16.8 ms, p95 19.4 ms across the
  full collapse.

Press <kbd>D</kbd> in development for the inspector (frame rate, draw calls,
and a slider that scrubs the entire transition).

## Deployment

`npm run build` produces a fully static `dist/`. Asset paths are root-absolute
(`base: '/'` in `vite.config.ts`) — the site is meant to live at a domain root.
Hosting it under a subpath instead needs that `base` changed to match, since
division URLs are real paths and a relative base would resolve the built
assets against the current deep link rather than the site root.

Division URLs (`/project-development`, …) use the History API, so **unknown
paths must be rewritten to `index.html`**. `vercel.json` in the repo root
already does this for Vercel. Equivalent for other hosts:

- Netlify — `_redirects`: `/*  /index.html  200`
- Apache — `.htaccess`: `FallbackResource /index.html`
- nginx — `try_files $uri $uri/ /index.html;`

Without the rewrite the site still works; only a directly opened or refreshed
division link would 404.

## Accessibility and fallbacks

- The mark is a real `<button>`; tiles are keyboard reachable with a visible
  focus ring; <kbd>Esc</kbd> leaves a division.
- `prefers-reduced-motion` replaces the collapse with a short crossfade.
- Without WebGL 2 the experience is replaced by a plain text page.
- The render loop pauses while the tab is hidden.

## Known gaps

- Division copy is placeholder. Structure and transitions are final.
- Typography uses a system serif stack; swap in self-hosted `.woff2` files via
  `--font-serif` in `src/styles/tokens.css` when the brand font is decided.
