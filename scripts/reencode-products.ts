/**
 * Match each public/products/*.webp to the closest items/*.JPG by tiny thumbnail
 * distance, then re-export at higher quality (max width 1800, webp q=86).
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "public", "products");
const SRC = path.join(ROOT, "items");
const THUMB = 24;

async function thumbVec(file: string): Promise<Buffer> {
  return sharp(file)
    .rotate()
    .resize(THUMB, THUMB, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

function distance(a: Buffer, b: Buffer): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s;
}

async function main() {
  const jpgs = fs
    .readdirSync(SRC)
    .filter((f) => /\.jpe?g$/i.test(f))
    .map((f) => path.join(SRC, f));

  console.log(`JPG sources: ${jpgs.length}`);
  const jpgThumbs: { file: string; vec: Buffer }[] = [];
  for (const file of jpgs) {
    try {
      jpgThumbs.push({ file, vec: await thumbVec(file) });
    } catch (e) {
      console.warn("skip jpg", file, e);
    }
  }

  const webps = fs.readdirSync(OUT).filter((f) => f.endsWith(".webp"));
  const used = new Set<string>();

  for (const name of webps) {
    const webpPath = path.join(OUT, name);
    let best = jpgThumbs[0];
    let bestDist = Number.POSITIVE_INFINITY;
    const wVec = await thumbVec(webpPath);

    for (const j of jpgThumbs) {
      if (used.has(j.file)) continue;
      const d = distance(wVec, j.vec);
      if (d < bestDist) {
        bestDist = d;
        best = j;
      }
    }

    if (!best) {
      console.warn("no match", name);
      continue;
    }
    used.add(best.file);

    const buf = await sharp(best.file)
      .rotate()
      .resize({ width: 1800, height: 2400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();

    try {
      fs.writeFileSync(webpPath, buf);
    } catch {
      const alt = webpPath.replace(/\.webp$/i, ".q86.webp");
      fs.writeFileSync(alt, buf);
      console.warn(`locked, wrote ${path.basename(alt)} instead`);
      continue;
    }
    const meta = await sharp(webpPath).metadata();
    console.log(
      `${name} ← ${path.basename(best.file)} | ${meta.width}x${meta.height} | dist=${bestDist}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
