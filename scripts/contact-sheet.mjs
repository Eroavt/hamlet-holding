/**
 * Stitches the frames in .captures/ into one downscaled contact sheet, so a
 * whole timeline can be reviewed in a single image instead of six 5 MB PNGs.
 *
 *   node scripts/contact-sheet.mjs [cols] [tileWidth]
 */
import { Jimp } from 'jimp';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, '.captures');

const cols = Number(process.argv[2] ?? 3);
const tileW = Number(process.argv[3] ?? 420);
/** Optional centre crop as a fraction of the frame, e.g. 0.45 to inspect the globe. */
const crop = Number(process.argv[4] ?? 0);

const files = readdirSync(DIR)
  .filter((f) => f.endsWith('.png') && f !== 'sheet.png')
  .sort();

if (!files.length) {
  console.log('no captures');
  process.exit(0);
}

const cropTo = (img) => {
  if (!crop) return img;
  const w = Math.round(img.bitmap.width * crop);
  const h = Math.round(img.bitmap.height * crop);
  return img.crop({
    x: Math.round((img.bitmap.width - w) / 2),
    y: Math.round((img.bitmap.height - h) / 2),
    w,
    h,
  });
};

const first = cropTo(await Jimp.read(join(DIR, files[0])));
const tileH = Math.round((first.bitmap.height / first.bitmap.width) * tileW);
const rows = Math.ceil(files.length / cols);

const sheet = new Jimp({ width: cols * tileW, height: rows * tileH, color: 0x101010ff });

for (let i = 0; i < files.length; i++) {
  const img = cropTo(await Jimp.read(join(DIR, files[i])));
  img.resize({ w: tileW, h: tileH });
  sheet.composite(img, (i % cols) * tileW, Math.floor(i / cols) * tileH);
}

const out = join(DIR, 'sheet.png');
await sheet.write(out);
console.log(`${files.length} frames -> ${out} (${sheet.bitmap.width}x${sheet.bitmap.height})`);
console.log(files.join('  '));
