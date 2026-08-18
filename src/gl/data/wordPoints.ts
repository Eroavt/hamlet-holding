/**
 * Turns a line of type into particle targets.
 *
 * The letters are rasterised once on a 2D canvas and the lit pixels become a
 * lookup table; every particle then picks a pixel at random and jitters inside
 * it. Rejection sampling against the bitmap would have been the obvious way
 * and is the wrong one — the glyphs cover about a tenth of their box, so nine
 * out of ten tries would be thrown away and a quarter of a million particles
 * would cost millions of attempts. Collecting the lit pixels first makes every
 * sample O(1).
 *
 * Coordinates come back normalised: x spans -1 … 1 across the full width of
 * the line, y uses the *same* scale so the aspect survives, and the caller
 * multiplies by whatever half-width the camera can actually see. That way the
 * words fit the frame on a phone and on a widescreen without rebaking.
 */

/** Rasterisation width. High enough that the sampled edges stay clean. */
const RASTER_W = 1600;
/**
 * Share of the particles that are *not* in the letters.
 *
 * These become the galaxy the line hangs over, so the majority belongs to
 * them: at the old fourteen per cent the disc was a thin smear and the text
 * a solid slab. The xy they are given here is only a fallback — the reveal
 * shader places them procedurally and reads nothing but the w flag.
 */
const SCATTER_SHARE = 0.62;

export interface WordPoints {
  /** Four floats per particle: xyz normalised, w = 1 in a glyph, 0 scattered. */
  data: Float32Array;
  /** Height of the rasterised line relative to its half-width. */
  aspect: number;
}

export function buildWordPoints(text: string, count: number): WordPoints {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // Measure at a reference size, then scale so the line lands on RASTER_W.
  const REF = 200;
  const font = (px: number): string => `700 ${px}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.font = font(REF);
  // Wide tracking is what makes it read as an inscription rather than a
  // headline. Not supported everywhere; the layout still works without it.
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '0.14em';
  const refWidth = ctx.measureText(text).width;

  const size = Math.max(8, (REF * (RASTER_W - 40)) / Math.max(refWidth, 1));
  ctx.font = font(size);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '0.14em';
  const m = ctx.measureText(text);
  const ascent = m.actualBoundingBoxAscent || size * 0.72;
  const descent = m.actualBoundingBoxDescent || size * 0.2;

  canvas.width = RASTER_W;
  canvas.height = Math.max(2, Math.ceil(ascent + descent) + 8);
  // Sizing the canvas resets the context, so the font has to be set again.
  ctx.font = font(size);
  if ('letterSpacing' in ctx) (ctx as CanvasRenderingContext2D).letterSpacing = '0.14em';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(text, canvas.width / 2, ascent + 4);

  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const lit: number[] = [];
  for (let i = 0, p = 0; i < px.length; i += 4, p++) {
    // Red channel alone is enough — the type is drawn pure white.
    if (px[i] > 110) lit.push(p);
  }

  const data = new Float32Array(count * 4);
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;

  for (let i = 0; i < count; i++) {
    const o = i * 4;

    // Spread deterministically across the buffer rather than drawn at random,
    // so neither population can clump. Stepping the fraction and watching for
    // it to tick over gives the exact share; taking a modulus of a rounded
    // stride quantises it (0.62 would have come out as one in two).
    const scatter = Math.floor(i * SCATTER_SHARE) !== Math.floor((i - 1) * SCATTER_SHARE);
    if (lit.length === 0 || scatter) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.25 + Math.pow(Math.random(), 0.65) * 1.5;
      data[o] = Math.cos(a) * r;
      data[o + 1] = Math.sin(a) * r * 0.52;
      data[o + 2] = (Math.random() - 0.5) * 0.5;
      data[o + 3] = 0;
      continue;
    }

    const p = lit[(Math.random() * lit.length) | 0];
    const x = (p % canvas.width) + Math.random();
    const y = ((p / canvas.width) | 0) + Math.random();

    data[o] = (x - halfW) / halfW;
    data[o + 1] = -(y - halfH) / halfW;
    // A shallow slab rather than a flat plane: at a dead-flat zero the words
    // read as a decal pasted on the screen instead of standing in the field.
    data[o + 2] = (Math.random() - 0.5) * 0.055;
    data[o + 3] = 1;
  }

  return { data, aspect: canvas.height / canvas.width };
}
