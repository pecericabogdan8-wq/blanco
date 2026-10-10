/**
 * Re-sort items/ into product galleries using sweater body color + portrait accents.
 *
 * Rules (from brand owner):
 * - pink/coral      → lesya (~few shots)
 * - white/off-white → stus
 * - red/burgundy    → chornovil
 * - black + red outline accents  → kuzma
 * - black + white outline portrait → kostenko
 * - milk/beige      → shevchenko (default beige) / symonenko (split later by cluster)
 * - blue            → lobanovskyi
 * - scarf / ВОЛЯ    → freedom-scarf
 * - tee-like        → tee buckets (skryabin vs washed)
 *
 * Usage: npx tsx scripts/reclassify-by-color.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "items");
const OUT = path.join(ROOT, "public", "products", "galleries");
const MANIFEST = path.join(OUT, "manifest.json");
const REPORT = path.join(OUT, "classify-report.json");

const MAX_EDGE = 2200;
const JPEG_Q = 92;

type Key =
  | "lesya"
  | "stus"
  | "chornovil"
  | "kuzma"
  | "kostenko"
  | "shevchenko"
  | "symonenko"
  | "lobanovskyi"
  | "freedom-scarf"
  | "kuzma-tee"
  | "washed-tee"
  | "unassigned";

type Stats = {
  name: string;
  file: string;
  meanR: number;
  meanG: number;
  meanB: number;
  sat: number;
  lum: number;
  redShare: number;
  whiteShare: number;
  blackShare: number;
  pinkish: number;
  blueish: number;
  beigeish: number;
  scarfScore: number;
  teeScore: number;
  accentRedShare: number;
  accentWhiteShare: number;
  key: Key;
  reason: string;
};

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s, l };
}

async function analyze(file: string): Promise<Omit<Stats, "key" | "reason">> {
  const { data, info } = await sharp(file)
    .rotate()
    .resize(120, 160, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  // Torso band: middle 45% width, 35–70% height (sweater body)
  const x0 = Math.floor(w * 0.28);
  const x1 = Math.floor(w * 0.72);
  const y0 = Math.floor(h * 0.32);
  const y1 = Math.floor(h * 0.72);
  // Portrait accents: center chest print
  const px0 = Math.floor(w * 0.35);
  const px1 = Math.floor(w * 0.65);
  const py0 = Math.floor(h * 0.28);
  const py1 = Math.floor(h * 0.55);

  let n = 0;
  let sr = 0,
    sg = 0,
    sb = 0;
  let redP = 0,
    whiteP = 0,
    blackP = 0,
    pinkP = 0,
    blueP = 0,
    beigeP = 0;
  let satSum = 0;

  const sample = (
    xA: number,
    xB: number,
    yA: number,
    yB: number,
    fn: (r: number, g: number, b: number, hsl: { h: number; s: number; l: number }) => void
  ) => {
    for (let y = yA; y < yB; y++) {
      for (let x = xA; x < xB; x++) {
        const i = (y * w + x) * 3;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        fn(r, g, b, rgbToHsl(r, g, b));
      }
    }
  };

  sample(x0, x1, y0, y1, (r, g, b, hsl) => {
    n++;
    sr += r;
    sg += g;
    sb += b;
    satSum += hsl.s;
    if (hsl.l < 0.18) blackP++;
    if (hsl.l > 0.78 && hsl.s < 0.18) whiteP++;
    // red / burgundy
    if (hsl.s > 0.25 && hsl.l > 0.12 && hsl.l < 0.55 && (hsl.h < 25 || hsl.h > 340))
      redP++;
    // pink / coral
    if (
      hsl.s > 0.2 &&
      hsl.l > 0.35 &&
      hsl.l < 0.78 &&
      hsl.h > 330 &&
      hsl.h < 20
    )
      pinkP++;
    if (hsl.s > 0.18 && hsl.l > 0.4 && hsl.l < 0.75 && hsl.h >= 340)
      pinkP += 0.5;
    if (hsl.s > 0.15 && hsl.l > 0.45 && hsl.l < 0.8 && hsl.h > 0 && hsl.h < 25)
      pinkP += 0.4;
    // blue
    if (hsl.s > 0.2 && hsl.l > 0.15 && hsl.l < 0.55 && hsl.h > 195 && hsl.h < 255)
      blueP++;
    // beige / bone / milk
    if (
      hsl.s < 0.28 &&
      hsl.l > 0.55 &&
      hsl.l < 0.88 &&
      hsl.h > 20 &&
      hsl.h < 60
    )
      beigeP++;
    if (hsl.s < 0.15 && hsl.l > 0.62 && hsl.l < 0.9) beigeP += 0.3;
  });

  let accentRed = 0;
  let accentWhite = 0;
  let accentN = 0;
  sample(px0, px1, py0, py1, (r, g, b, hsl) => {
    accentN++;
    // vivid red outline strokes
    if (hsl.s > 0.45 && hsl.l > 0.2 && hsl.l < 0.65 && (hsl.h < 18 || hsl.h > 345))
      accentRed++;
    if (hsl.l > 0.82 && hsl.s < 0.2) accentWhite++;
  });

  // Scarf: lots of light fabric + graphic contrast, often square-ish crop or "ВОЛЯ" area high white+black
  const scarfScore =
    (whiteP / Math.max(1, n)) * 0.5 +
    (blackP / Math.max(1, n)) * 0.2 +
    (beigeP / Math.max(1, n)) * 0.3;

  // Tee heuristic: more black overall + lower beige, often darker washed look; sleeve region brighter background
  let bgBright = 0;
  let bgN = 0;
  sample(0, w, 0, Math.floor(h * 0.15), (_r, _g, _b, hsl) => {
    bgN++;
    if (hsl.l > 0.7) bgBright++;
  });
  const teeScore =
    (blackP / Math.max(1, n)) * 0.6 +
    (bgBright / Math.max(1, bgN)) * 0.4 -
    (beigeP / Math.max(1, n));

  return {
    name: path.basename(file),
    file,
    meanR: sr / n,
    meanG: sg / n,
    meanB: sb / n,
    sat: satSum / n,
    lum: (sr + sg + sb) / (3 * n) / 255,
    redShare: redP / n,
    whiteShare: whiteP / n,
    blackShare: blackP / n,
    pinkish: pinkP / n,
    blueish: blueP / n,
    beigeish: beigeP / n,
    scarfScore,
    teeScore,
    accentRedShare: accentRed / Math.max(1, accentN),
    accentWhiteShare: accentWhite / Math.max(1, accentN),
  };
}

function classify(s: Omit<Stats, "key" | "reason">): { key: Key; reason: string } {
  const ar = s.accentRedShare;
  const aw = s.accentWhiteShare;

  // Strong pink/coral → Lesya
  if (s.pinkish > 0.12 || (s.meanR > 160 && s.meanG > 90 && s.meanG < 160 && s.meanB > 90 && s.meanB < 150 && s.sat > 0.18 && s.lum > 0.4)) {
    return { key: "lesya", reason: `pinkish=${s.pinkish.toFixed(2)}` };
  }

  // Blue → Lobanovskyi
  if (s.blueish > 0.1 || (s.meanB > s.meanR + 25 && s.meanB > s.meanG + 10 && s.sat > 0.15 && s.lum < 0.55)) {
    return { key: "lobanovskyi", reason: `blueish=${s.blueish.toFixed(2)}` };
  }

  // Red / burgundy body → Chornovil
  if (s.redShare > 0.18 && s.blackShare < 0.45 && s.lum < 0.5 && s.lum > 0.15) {
    return { key: "chornovil", reason: `redShare=${s.redShare.toFixed(2)}` };
  }

  // White / light grey body → Stus
  if (s.whiteShare > 0.22 && s.blackShare < 0.35 && s.lum > 0.55 && s.sat < 0.2) {
    return { key: "stus", reason: `whiteShare=${s.whiteShare.toFixed(2)}` };
  }

  // Black body: Kuzma (red accents) vs Kostenko (white outline)
  if (s.blackShare > 0.35 || s.lum < 0.28) {
    // tee-like flat / washed black with bright bg
    if (s.teeScore > 0.55 && s.beigeish < 0.08) {
      if (ar > 0.04 || s.redShare > 0.04) {
        return { key: "kuzma-tee", reason: `tee+red accents ar=${ar.toFixed(2)}` };
      }
      return { key: "washed-tee", reason: `teeScore=${s.teeScore.toFixed(2)}` };
    }
    if (ar > 0.035 && ar >= aw * 0.7) {
      return { key: "kuzma", reason: `black+redOutline ar=${ar.toFixed(2)}` };
    }
    if (aw > 0.08) {
      return { key: "kostenko", reason: `black+whiteOutline aw=${aw.toFixed(2)}` };
    }
    // default black knit without strong red → kostenko-ish; if some red → kuzma
    if (ar > 0.015) return { key: "kuzma", reason: `black+someRed ar=${ar.toFixed(2)}` };
    return { key: "kostenko", reason: `black default aw=${aw.toFixed(2)}` };
  }

  // Beige / milk → Shevchenko vs Symonenko (split by slight warmth / contrast later)
  if (s.beigeish > 0.12 || (s.lum > 0.48 && s.sat < 0.22 && s.meanR > 140 && s.meanG > 130)) {
    // scarf: high white+graphic, often wider light field
    if (s.scarfScore > 0.35 && s.whiteShare > 0.15 && s.blackShare > 0.08 && s.beigeish > 0.1) {
      // could be scarf — check if torso is very light with sparse dark ink
      if (s.lum > 0.6 && s.blackShare < 0.25) {
        return { key: "freedom-scarf", reason: `scarfScore=${s.scarfScore.toFixed(2)}` };
      }
    }
    // Symonenko vs Shevchenko: cooler/greyer line-art beige → symonenko
    if (aw > 0.12 && s.sat < 0.12) {
      return { key: "symonenko", reason: `beige+line aw=${aw.toFixed(2)}` };
    }
    if (s.meanB + 6 >= s.meanR && s.sat < 0.1) {
      return { key: "symonenko", reason: `cool beige` };
    }
    return { key: "shevchenko", reason: `beigeish=${s.beigeish.toFixed(2)}` };
  }

  // Scarf fallback
  if (s.lum > 0.62 && s.sat < 0.15 && s.blackShare > 0.05 && s.blackShare < 0.3) {
    return { key: "freedom-scarf", reason: `light graphic scarf lum=${s.lum.toFixed(2)}` };
  }

  return { key: "unassigned", reason: `no match lum=${s.lum.toFixed(2)} black=${s.blackShare.toFixed(2)}` };
}

async function exportJpeg(src: string, dest: string) {
  await sharp(src)
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(dest);
}

async function main() {
  const files = fs
    .readdirSync(SRC)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(SRC, f));

  console.log(`analyzing ${files.length}…`);
  const rows: Stats[] = [];

  for (const file of files) {
    try {
      const a = await analyze(file);
      const { key, reason } = classify(a);
      rows.push({ ...a, key, reason });
    } catch (e) {
      console.warn("skip", path.basename(file), e);
    }
  }

  // Post-pass: cap Lesya to strongest pinks if too many
  const lesya = rows.filter((r) => r.key === "lesya").sort((a, b) => b.pinkish - a.pinkish);
  if (lesya.length > 8) {
    for (const extra of lesya.slice(8)) {
      extra.key = "unassigned";
      extra.reason += " | demoted excess lesya";
    }
  }

  // Split remaining beige shevchenko: if two clusters by meanR, cooler → symonenko
  const beige = rows.filter((r) => r.key === "shevchenko");
  if (beige.length > 8) {
    const meanR = beige.reduce((s, r) => s + r.meanR, 0) / beige.length;
    for (const r of beige) {
      if (r.meanR < meanR - 8 && r.accentWhiteShare === undefined) {
        /* keep */
      }
      // cooler / greyer beige → symonenko
      if (r.meanB > r.meanR - 5 && r.sat < 0.1) {
        r.key = "symonenko";
        r.reason += " | cool beige→symonenko";
      }
    }
  }

  const byKey = new Map<Key, Stats[]>();
  for (const r of rows) {
    const list = byKey.get(r.key) ?? [];
    list.push(r);
    byKey.set(r.key, list);
  }

  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const manifest: Record<string, { images: string[]; primary: string; sources: string[] }> = {};
  const counts: Record<string, number> = {};

  for (const [key, list] of byKey) {
    // prefer higher confidence order
    list.sort((a, b) => {
      if (key === "lesya") return b.pinkish - a.pinkish;
      if (key === "kuzma") return b.accentRedShare - a.accentRedShare;
      return a.name.localeCompare(b.name);
    });

    const dir = path.join(OUT, key);
    fs.mkdirSync(dir, { recursive: true });
    const images: string[] = [];
    const sources: string[] = [];
    let i = 0;
    for (const item of list) {
      i++;
      const nn = String(i).padStart(2, "0");
      await exportJpeg(item.file, path.join(dir, `${nn}.jpg`));
      // also tiny thumb for QA contact sheet
      await sharp(item.file)
        .rotate()
        .resize(160, 200, { fit: "cover" })
        .jpeg({ quality: 70 })
        .toFile(path.join(dir, `_thumb_${nn}.jpg`));
      if (key !== "unassigned") {
        images.push(`/products/galleries/${key}/${nn}.jpg`);
        sources.push(`items/${item.name}`);
      }
    }
    counts[key] = list.length;
    if (key !== "unassigned" && images.length) {
      manifest[key] = { images, primary: images[0], sources };
    }
    console.log(`${key}: ${list.length}`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  fs.writeFileSync(
    REPORT,
    JSON.stringify(
      rows.map((r) => ({
        name: r.name,
        key: r.key,
        reason: r.reason,
        lum: +r.lum.toFixed(3),
        pink: +r.pinkish.toFixed(3),
        red: +r.redShare.toFixed(3),
        blue: +r.blueish.toFixed(3),
        beige: +r.beigeish.toFixed(3),
        black: +r.blackShare.toFixed(3),
        white: +r.whiteShare.toFixed(3),
      })),
      null,
      2
    ) + "\n"
  );
  console.log("manifest", MANIFEST);
  console.log("report", REPORT);
  console.log("counts", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
