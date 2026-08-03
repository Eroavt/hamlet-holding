/**
 * Turns the original brand artwork (white-on-black JPEG) into transparent PNGs.
 *
 * The source is a flat lockup: crown, "HAMLET", "HOLDING GROUP". Because it is
 * pure white on pure black, luminance IS the alpha channel — no manual masking
 * needed, and the antialiased edges survive intact.
 *
 * Run with `npm run brand`. Output lands in public/brand/.
 */
import { Jimp } from 'jimp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets-source', 'Webseite Logo.jpeg');
const OUT = join(ROOT, 'public', 'brand');

/** Pixels dimmer than this are treated as pure background (kills JPEG noise). */
const FLOOR = 12;
/** A row counts as "ink" if at least this many pixels exceed FLOOR. */
const ROW_MIN_INK = 3;
/** Bands closer than this merge — the crown's baseline belongs to the crown. */
const MERGE_GAP = 28;
/** Transparent breathing room so CSS drop-shadows are not clipped. */
const PAD = 10;

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Maps raw luminance to alpha, lifting the floor to true zero. */
const toAlpha = (l) => (l < FLOOR ? 0 : Math.min(255, Math.round(((l - FLOOR) * 255) / (255 - FLOOR))));

async function main() {
  await mkdir(OUT, { recursive: true });

  const img = await Jimp.read(SRC);
  const { width: W, height: H } = img.bitmap;
  const data = img.bitmap.data;
  console.log(`source: ${W}x${H}`);

  // Single pass: luminance map + row/column ink profiles.
  const L = new Uint8Array(W * H);
  const rowInk = new Int32Array(H);
  const colInk = new Int32Array(W);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const l = Math.min(255, Math.round(lum(data[i], data[i + 1], data[i + 2])));
      L[y * W + x] = l;
      if (l > FLOOR * 2) {
        rowInk[y]++;
        colInk[x]++;
      }
    }
  }

  // Horizontal bands of ink → the individual lockup elements.
  const bands = [];
  let open = -1;
  for (let y = 0; y < H; y++) {
    const on = rowInk[y] >= ROW_MIN_INK;
    if (on && open < 0) open = y;
    else if (!on && open >= 0) {
      bands.push([open, y - 1]);
      open = -1;
    }
  }
  if (open >= 0) bands.push([open, H - 1]);

  const merged = [];
  for (const [s, e] of bands) {
    const last = merged[merged.length - 1];
    if (last && s - last[1] <= MERGE_GAP) last[1] = e;
    else merged.push([s, e]);
  }
  console.log('elements:', merged.map(([s, e]) => `${s}..${e}`).join('  '));

  let x0 = 0;
  while (x0 < W && colInk[x0] < 2) x0++;
  let x1 = W - 1;
  while (x1 > 0 && colInk[x1] < 2) x1--;

  const crop = async (cx0, cy0, cx1, cy1, name) => {
    const cw = cx1 - cx0 + 1;
    const ch = cy1 - cy0 + 1;
    if (cw <= 0 || ch <= 0) throw new Error(`bad crop for ${name}: ${cw}x${ch}`);
    const out = new Jimp({ width: cw, height: ch, color: 0x00000000 });
    const od = out.bitmap.data;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        const a = toAlpha(L[(cy0 + y) * W + (cx0 + x)]);
        const o = (y * cw + x) * 4;
        od[o] = 255;
        od[o + 1] = 255;
        od[o + 2] = 255;
        od[o + 3] = a;
      }
    }
    await out.write(join(OUT, name));
    console.log(`  ${name.padEnd(14)} ${cw}x${ch}`);
  };

  const left = Math.max(0, x0 - PAD);
  const right = Math.min(W - 1, x1 + PAD);
  const clampTop = (v) => Math.max(0, v - PAD);
  const clampBot = (v) => Math.min(H - 1, v + PAD);

  const names = ['crown.png', 'wordmark.png', 'subline.png'];
  for (let i = 0; i < merged.length && i < names.length; i++) {
    // Tighten each element horizontally to its own ink, not the whole artboard.
    const [ys, ye] = merged[i];
    let ex0 = W - 1;
    let ex1 = 0;
    for (let y = ys; y <= ye; y++) {
      for (let x = 0; x < W; x++) {
        if (L[y * W + x] > FLOOR * 2) {
          if (x < ex0) ex0 = x;
          if (x > ex1) ex1 = x;
        }
      }
    }
    await crop(Math.max(0, ex0 - PAD), clampTop(ys), Math.min(W - 1, ex1 + PAD), clampBot(ye), names[i]);
  }

  await crop(left, clampTop(merged[0][0]), right, clampBot(merged[merged.length - 1][1]), 'lockup.png');

  // Social preview: transparent PNGs render badly on most platforms, so flatten
  // the lockup onto the brand black at the conventional 1200x630.
  const lockup = await Jimp.read(join(OUT, 'lockup.png'));
  const og = new Jimp({ width: 1200, height: 630, color: 0x010105ff });
  const lw = 460;
  lockup.resize({ w: lw, h: Math.round((lockup.bitmap.height / lockup.bitmap.width) * lw) });
  og.composite(lockup, Math.round((1200 - lw) / 2), Math.round((630 - lockup.bitmap.height) / 2));
  await og.write(join(OUT, '..', 'og-image.jpg'));
  console.log('  og-image.jpg   1200x630');

  console.log('done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
