import type { Form } from '@/core/Viewport';

/**
 * The phone composition, solved from the window rather than fitted by
 * breakpoints. See design/mobile/SPEC.md.
 *
 * The globe is centred and the four divisions sit in the diagonal corners of
 * its bounding square — the space a circle leaves empty — so the globe can be
 * half the width of the screen without the composition getting any taller.
 *
 * Marker offsets are published in *globe radii*, not pixels. CSS multiplies
 * them by the live projected radius every frame, which is what attaches the
 * constellation to the globe: when the globe swells on the way into a
 * division, the markers ride out past the screen edges with it, and ride back
 * in when it shrinks. No tween ever moves a marker.
 */
export interface PhoneSolution {
  /** Globe radius in CSS px. */
  R: number;
  /** Globe centre, in page coordinates (scroll 0). */
  cx: number;
  cy: number;
  /** Marker centre offsets from the globe centre, in globe radii. */
  axR: number;
  ayR: number;
  /** Icon box, label size and label gap in CSS px. */
  ic: number;
  fs: number;
  gap: number;
  /** Height the constellation needs below the header. */
  bandBottom: number;
}

/**
 * Space kept free at the bottom of the first screen for the scroll cue. The
 * overview is two screens: the constellation alone, then the figures rising
 * over a receding globe — see App.applyScroll.
 */
export const CUE_RESERVE = 64;

/** Air between the mark and the first row of labels. */
export const markGap = (W: number): number => Math.round(W * 0.09);

/**
 * Header top padding that centres the mark and the constellation together in
 * the first screen (above the scroll cue). `groupBelowMark` is the height of
 * the constellation from the first label to the last.
 */
export function phoneHeaderTop(height: number, width: number, markH: number, groupBelowMark: number): number {
  const group = markH + markGap(width) + groupBelowMark;
  return Math.round((height - CUE_RESERVE - group) / 2);
}

const clamp = (lo: number, v: number, hi: number): number => Math.min(hi, Math.max(lo, v));

export function solvePhone(
  form: Form,
  width: number,
  height: number,
  headerBottom: number,
  widestLabel: number,
): PhoneSolution | null {
  if (form === 'phone') {
    const W = width;
    const ic = Math.round(clamp(48, W * 0.1425, 60));
    const fs = clamp(11, W * 0.032, 13);
    const gap = W < 360 ? 8 : 10;
    const labelH = 2 * Math.round(fs * 1.34);

    // Width alone decides the composition. The address bar changes the height
    // on every scroll, and the globe must not breathe with it.
    const R = Math.round(W * 0.235);
    const ax = W * 0.29;
    // The icon's corner has to clear the sphere — its half-diagonal plus air.
    const dMin = R + ic * Math.SQRT1_2 + 8;
    const ay = Math.sqrt(Math.max(dMin * dMin - ax * ax, (ic / 2 + 6) ** 2));

    // Hung a fixed distance under the mark. The first screen holds nothing
    // else, so App centres the mark and the constellation together, as one
    // group, by moving the header down — see phoneHeaderTop().
    const half = ay + ic / 2 + gap + labelH;
    const cy = Math.round(headerBottom + markGap(W) + half);
    const bandBottom = cy + half;
    return { R, cx: W / 2, cy, axR: ax / R, ayR: ay / R, ic, fs, gap, bandBottom };
  }

  if (form === 'phone-land') {
    const W = width;
    const H = height;
    const ic = Math.round(clamp(44, H * 0.135, 54));
    const fs = clamp(10.5, H * 0.03, 12);
    const gap = 14;
    const R = Math.round(Math.min(H * 0.243, W * 0.126));
    const cx = W / 2;
    const cy = Math.round(headerBottom + (H - 36 - headerBottom) / 2 + 6);

    // Divisions either side of the globe, labels on the outside. The pair is
    // pushed out by a share of the width, but never so far that the widest
    // label leaves the screen.
    const gutter = 20;
    const want = R + W * 0.15;
    const most = cx - (gutter + widestLabel + gap + ic / 2);
    const least = R + ic / 2 + 12;
    const ax = Math.max(least, Math.min(want, most));
    const ay = Math.max(R * 0.58, ic / 2 + 8);
    return { R, cx, cy, axR: ax / R, ayR: ay / R, ic, fs, gap, bandBottom: cy + R + 24 };
  }

  return null;
}

/**
 * The lowest the copy of a division may reach before it scrolls inside its
 * own column, and the space kept below it for the horizon and the dock. Short
 * phones keep less: the dock sits closer to the bottom edge there, and every
 * line of copy matters more than a taller strip of globe.
 */
export function phoneDockReserve(form: Form, height: number): number {
  if (form === 'phone-land') return 140;
  return height < 700 ? 140 : 190;
}

export function phoneTextLimit(form: Form, height: number): number {
  return height - phoneDockReserve(form, height) - (form === 'phone-land' ? 22 : 40);
}

/**
 * Where the globe sits while a division is open on a phone: a horizon under
 * the copy. Its cap starts below the text, but never so low that it hides
 * behind the dock, and never so high that it climbs into the copy.
 */
export function phoneDetailPlacement(
  form: Form,
  width: number,
  height: number,
  textBottom: number,
  restR: number,
  restCy: number,
): { zoom: number; drop: number; capTop: number } {
  const land = form === 'phone-land';
  const rDetail = land ? width * 0.5 : width * 0.97;
  // Landscape zooms the sphere hardest, and at that zoom perspective puts its
  // edge ~16 px below the flat estimate — its larger reserve absorbs that.
  const capTop = clamp(height * 0.6, textBottom + (land ? 22 : 40), height - phoneDockReserve(form, height));
  const zoom = rDetail / restR;
  // One world unit is restR pixels at the globe's depth, since it is a unit
  // sphere — so the drop is a division, not a second projection.
  const drop = (capTop + rDetail - restCy) / restR;
  return { zoom, drop, capTop };
}
