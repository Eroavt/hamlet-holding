# Phone redesign — spec

Concept frames: `storyboard.html` / `storyboard.jpg` (the whole flow, current), `concept-v2.html` (static screens), `concept.html` (v1, superseded).
Plates in `plates/` are rendered by the live engine, so the globe in every frame is
the real one at the size and position this spec calls for.

Scope: phones only. Desktop and tablet stay exactly as they are.

## Form factors

| `data-form` | Rule | Layout |
|---|---|---|
| `phone` | portrait, width ≤ 600 | single column, overview scrolls |
| `phone-land` | landscape, height ≤ 500 | two panes: globe left, content right |
| `default` | everything else | unchanged |

Decided in `Viewport` from the *visible* height (`visualViewport` / `svh`), not the
device height — an iPhone 16 in Safari shows 393×659, not 393×852.

## Principle: the DOM decides, the globe follows

Today the camera solves a ring, falls back to a grid, and CSS chases it. On phones
that produced a 36 px globe on an iPhone SE and a different size on every device.

New: the phone layout contains an empty `#globe-slot`. Its measured rect *is* the
globe — `Camera.fit` sizes and centres the sphere to it. Because the slot is in the
document flow, scrolling moves it, and the globe follows the content by
construction. One code path, correct at every size.

## Overview (phone) — v2, the reference composition

Frames: `concept-v2.html` · `overview_v2.jpg` · `detail_land_v2.jpg`. (v1's list
layout in `concept.html` is superseded.)

1. **Mark** — lockup centred, 184 px wide on 393 (≈ 47 % of width), 150 px on 320.
   Language switch vertical top-right (DE | EN | RU), 44 px hit areas, as in the reference.
2. **Constellation** — globe centred, diameter 52 % of width (204 px on 393; the
   reference is 158). The four markers sit in the diagonal corners of the globe's
   bounding square — space a circle leaves empty — so the bigger globe costs no
   height. Icon centres at ±29.5 % of width horizontally, at a distance of
   R + half-diagonal + 8 px from the centre. Icons 56 px (48 on 320, 60 on 440).
   Labels outside each row (above the upper pair, below the lower pair) and anchored to
   the icon's *outer* edge, not centred: centred, the Russian "СТРОИТЕЛЬСТВОМ" (~152 px)
   runs off screen. Outer-anchored, every label grows into the free space toward the
   centre, and the four form two clean vertical edges. Auto-fit as a safety net.
3. **Orbit** — a dotted hairline circle through the four icon centres plus a faint
   solid one 9 px outside it, masked behind labels and icons.
4. **Figures** — heading on two lines, the second flanked by rules
   ("— in den letzten 7 Jahren —"); three columns with hairline dividers; captions
   broken by hand for phone (`Mietvertrags-/volumen`, `Projekt-/volumen`) so nothing
   runs out of its column; numerals 16.5 px light, tabular. Count-up on scroll-in.
5. **Partner** — Seyband 20 px at 90 %.
6. **Footer** — company 11 px; Impressum / Datenschutz 11 px at 62 %, 44 px hit areas,
   safe-area inset.

On a full 393×852 screen all of it fits, like the reference. On a shorter visible
height (Safari with its bar: 393×659) constellation and figures stay on the first
screen and the page scrolls — nothing is ever compressed. In landscape the
constellation turns sideways: two markers either side of the globe, labels outside.

## Division (phone)

- Bar: `‹ Übersicht` button left (explicit back — today the only way back is tapping the
  logo), crown centre, language right.
- Copy left-aligned (centred body text of 6+ lines reads badly): eyebrow
  `GESCHÄFTSBEREICH 03 / 04`, title 30 px on two lines at the hyphen (24 px < 360 w),
  body 15.5 / 1.62 (was 12.5 px).
- The globe becomes the horizon: its cap is solved from the copy's measured bottom, so
  the text never sits on the sphere. RU copy is longest — the column scrolls inside
  itself before it would ever reach the cap.
- Dock: frosted capsule, four glyphs 64×56, active one lit. Swipe left/right anywhere on
  the screen (today: only on the canvas, undiscoverable).

## Intro (phone)

Mark centred on the visible screen (today it sits 8 % high on tall phones because its
anchor is centred in a grid row, not the viewport). Localised cue under it after ~2 s:
DE "Zum Betreten tippen" · EN "Tap to enter" · RU "Нажмите, чтобы войти".

## Type & spacing (phone)

| Role | Size / weight / tracking | Colour |
|---|---|---|
| Caption / eyebrow | 11 / 600 / .22em caps | 52–64 % |
| Division label | 13.5 / 600 / .12em caps | 94 % |
| Detail title | 30 / 700 / caps | 100 % |
| Body | 15.5 / 400 / 1.62 | 80 % |
| Figure | 34 / 300 / tabular | 100 % |
| Legal | 12 / 400 / .14em caps | 64 % |

No text below 11 px. All text ≥ 4.5:1 contrast. All targets ≥ 44×44. Gutter 24 px
(20 px below 360 w). Safe-area insets on all four sides.

## Verification

Playwright sweep: 13 formats (320×568 → 440×956, real-Safari heights, Fold cover,
two landscape) × 3 stages × 3 languages. Automated bounding-box collision check
(text vs globe, text vs dock, block vs block, anything off-screen) — the build fails
the sweep on any overlap. Before/after contact sheets per format.

## The flow (see storyboard.jpg)

One rule governs every transition: **nothing appears from nowhere.** Every element on
a screen came from somewhere on the previous one.

| Moment | What happens | Timing |
|---|---|---|
| Intro | Mark centred, cue fades in after 2 s | — |
| Enter | Stars collapse into the globe (existing shader); mark arcs up into its slot | 0–2.6 s |
| Arrive | City lights → orbit draws → markers de-blur one by one → figures count up | 2.2–3.4 s |
| Tap a division | Icon lights; a beam connects it to its city on the globe; others dim to 35 % | 0–180 ms |
| Descend | Globe swells and sinks, turning that city to face you. The orbit is attached to the globe, so the markers ride out past the screen edges — you fly through the ring. The tapped label detaches and grows into the headline. Mark shrinks to the crown. | 180–1300 ms |
| Land | Eyebrow, then body line by line; dock rises from below | 900–1500 ms |
| Switch | Swipe anywhere: globe follows the finger to the next city; text slides in swipe direction; dock indicator slides | 450 ms after release |
| Back | Exactly reversed: ring contracts in from the edges, headline shrinks back into its label | 0.88× pace |
| Scroll (short screens) | Globe and constellation move as one object; figures count when seen | — |
| Legal | Bottom sheet, swipe down to close | 350 ms |

Every transition is interruptible (a tap mid-flight retargets from where it is) and has
a reduced-motion version (crossfade, no flight). Browser back, the iOS edge-swipe and
the on-screen button all run the same reverse timeline.
