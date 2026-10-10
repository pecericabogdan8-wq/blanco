/**
 * Build per-product JPEG galleries from items/ using 48px thumbnail L1 matching
 * against seed webps in public/products/.
 *
 * Usage: npx tsx scripts/build-galleries.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "items");
const PRODUCTS_DIR = path.join(ROOT, "public", "products");
const GALLERIES_DIR = path.join(PRODUCTS_DIR, "galleries");
const UNASSIGNED_DIR = path.join(GALLERIES_DIR, "unassigned");
const MANIFEST_PATH = path.join(GALLERIES_DIR, "manifest.json");

const THUMB = 48;
const MAX_EDGE = 2200;
const JPEG_QUALITY = 90;
const MAX_ASSIGN_DISTANCE = 420_000;
const ASSIGN_MARGIN = 0.92;
const EXTRA_PRODUCT_MIN_SEP = 180_000;

export const GALLERY_PRODUCT_KEYS = [
  "shevchenko",
  "stus",
  "kuzma",
  "lesya",
  "kuzma-tee",
  "freedom-scarf",
  "chornovil",
  "kostenko",
] as const;

export type GalleryProductKey = (typeof GALLERY_PRODUCT_KEYS)[number];

const MAIN_PRODUCT_KEYS: GalleryProductKey[] = [
  "shevchenko",
  "stus",
  "kuzma",
  "lesya",
  "kuzma-tee",
  "freedom-scarf",
];

const FORCE_ASSIGN: Record<string, GalleryProductKey> = {
  "IMG_8790.PNG": "lesya",
  "IMG_8796.PNG": "lesya",
};

type ManifestEntry = {
  images: string[];
  primary: string;
  sources: string[];
};

export type GalleryManifest = Record<string, ManifestEntry>;

type SeedMap = Map<GalleryProductKey, Buffer[]>;

function webpBasenameToKey(name: string): GalleryProductKey | null {
  const base = name.replace(/\.webp$/i, "");
  if (base.startsWith("kuzma-tee")) return "kuzma-tee";
  if (base.startsWith("volya-scarf")) return "freedom-scarf";
  if (base.startsWith("shevchenko")) return "shevchenko";
  if (base.startsWith("stus")) return "stus";
  if (base.startsWith("kuzma")) return "kuzma";
  if (base.startsWith("lesya")) return "lesya";
  if (base.startsWith("chornovil")) return "chornovil";
  if (base.startsWith("kostenko")) return "kostenko";
  return null;
}

function isSourceImage(name: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(name);
}

async function thumbVec(file: string): Promise<Buffer> {
  return sharp(file)
    .rotate()
    .resize(THUMB, THUMB, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

function l1(a: Buffer, b: Buffer): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s;
}

function minDistToKey(vec: Buffer, seeds: SeedMap, key: GalleryProductKey): number {
  const list = seeds.get(key);
  if (!list?.length) return Number.POSITIVE_INFINITY;
  return Math.min(...list.map((s) => l1(vec, s)));
}

function rankKeys(vec: Buffer, seeds: SeedMap, keys: GalleryProductKey[]) {
  return keys
    .map((key) => ({ key, dist: minDistToKey(vec, seeds, key) }))
    .sort((a, b) => a.dist - b.dist);
}

function assignKey(
  vec: Buffer,
  seeds: SeedMap,
  keys: GalleryProductKey[]
): { key: GalleryProductKey; dist: number } | null {
  const ranked = rankKeys(vec, seeds, keys);
  const best = ranked[0];
  const second = ranked[1];
  if (!best || best.dist > MAX_ASSIGN_DISTANCE) return null;
  if (second && best.dist > second.dist * ASSIGN_MARGIN) return null;
  return best;
}

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });
}

function clearProductGalleries() {
  if (!fs.existsSync(GALLERIES_DIR)) {
    ensureDir(GALLERIES_DIR);
    return;
  }
  for (const name of fs.readdirSync(GALLERIES_DIR)) {
    const full = path.join(GALLERIES_DIR, name);
    if (name === "manifest.json") continue;
    fs.rmSync(full, { recursive: true, force: true });
  }
}

async function buildSeedMap(): Promise<SeedMap> {
  const seeds: SeedMap = new Map();
  const skipPrefix = /^(hero|lookbook|mentions?|hero-)/i;

  for (const file of fs.readdirSync(PRODUCTS_DIR)) {
    if (!file.endsWith(".webp") || file.includes(".tmp") || skipPrefix.test(file)) continue;
    const key = webpBasenameToKey(file);
    if (!key) continue;
    const full = path.join(PRODUCTS_DIR, file);
    try {
      const vec = await thumbVec(full);
      const list = seeds.get(key) ?? [];
      list.push(vec);
      seeds.set(key, list);
    } catch (e) {
      console.warn("skip seed webp", file, e);
    }
  }

  for (const key of MAIN_PRODUCT_KEYS) {
    console.log(`seeds ${key}: ${seeds.get(key)?.length ?? 0} webp(s)`);
  }
  return seeds;
}

function bootstrapExtraProducts(
  seeds: SeedMap,
  pool: { name: string; file: string; vec: Buffer }[]
): GalleryProductKey[] {
  const added: GalleryProductKey[] = [];
  if (pool.length < 4) return added;

  let seedA: (typeof pool)[0] | null = null;
  let seedAScore = -1;
  for (const s of pool) {
    const best = rankKeys(s.vec, seeds, MAIN_PRODUCT_KEYS)[0];
    const score = best?.dist ?? 0;
    if (score > seedAScore) {
      seedAScore = score;
      seedA = s;
    }
  }
  if (!seedA || seedAScore < 280_000) return added;

  seeds.set("chornovil", [seedA.vec]);
  added.push("chornovil");
  console.log(`bootstrap chornovil ← ${seedA.name} (main best ${seedAScore})`);

  let seedB: (typeof pool)[0] | null = null;
  let seedBScore = -1;
  for (const s of pool) {
    if (s.name === seedA.name) continue;
    const d = l1(s.vec, seedA.vec);
    if (d > seedBScore) {
      seedBScore = d;
      seedB = s;
    }
  }
  if (!seedB || seedBScore < EXTRA_PRODUCT_MIN_SEP) return added;

  seeds.set("kostenko", [seedB.vec]);
  added.push("kostenko");
  console.log(`bootstrap kostenko ← ${seedB.name} (sep ${seedBScore})`);

  return added;
}

async function exportJpeg(src: string, dest: string) {
  await sharp(src)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(dest);
}

export async function buildGalleries(): Promise<{
  manifest: GalleryManifest;
  counts: Record<string, number>;
  unassigned: number;
}> {
  ensureDir(SRC_DIR);
  clearProductGalleries();
  ensureDir(UNASSIGNED_DIR);

  const seeds = await buildSeedMap();

  const sources: { name: string; file: string; vec: Buffer }[] = [];
  for (const name of fs.readdirSync(SRC_DIR).filter(isSourceImage)) {
    const file = path.join(SRC_DIR, name);
    try {
      sources.push({ name, file, vec: await thumbVec(file) });
    } catch (e) {
      console.warn("skip source", name, e);
    }
  }
  console.log(`sources: ${sources.length}`);

  const assigned = new Map<GalleryProductKey, { name: string; file: string; dist: number }[]>();
  const pendingExtra: { name: string; file: string; vec: Buffer }[] = [];

  for (const s of sources) {
    const forced = FORCE_ASSIGN[s.name];
    if (forced) {
      const list = assigned.get(forced) ?? [];
      list.push({ name: s.name, file: s.file, dist: 0 });
      assigned.set(forced, list);
      continue;
    }

    const hit = assignKey(s.vec, seeds, MAIN_PRODUCT_KEYS);
    if (hit) {
      const list = assigned.get(hit.key) ?? [];
      list.push({ name: s.name, file: s.file, dist: hit.dist });
      assigned.set(hit.key, list);
    } else {
      pendingExtra.push(s);
    }
  }

  const extraKeys = bootstrapExtraProducts(seeds, pendingExtra);
  const stillUnassigned: { name: string; file: string; vec: Buffer }[] = [];

  if (extraKeys.length) {
    for (const s of pendingExtra) {
      const hit = assignKey(s.vec, seeds, extraKeys);
      if (hit) {
        const list = assigned.get(hit.key) ?? [];
        list.push({ name: s.name, file: s.file, dist: hit.dist });
        assigned.set(hit.key, list);
      } else {
        stillUnassigned.push(s);
      }
    }
  } else {
    stillUnassigned.push(...pendingExtra);
  }

  const manifest: GalleryManifest = {};
  const counts: Record<string, number> = {};

  for (const key of GALLERY_PRODUCT_KEYS) {
    const items = assigned.get(key);
    if (!items?.length) continue;

    items.sort((a, b) => a.dist - b.dist || a.name.localeCompare(b.name));

    const outDir = path.join(GALLERIES_DIR, key);
    ensureDir(outDir);

    const images: string[] = [];
    const srcNames: string[] = [];

    let idx = 0;
    for (const item of items) {
      idx += 1;
      const nn = String(idx).padStart(2, "0");
      const dest = path.join(outDir, `${nn}.jpg`);
      await exportJpeg(item.file, dest);
      images.push(`/products/galleries/${key}/${nn}.jpg`);
      srcNames.push(`items/${item.name}`);
    }

    manifest[key] = { images, primary: images[0], sources: srcNames };
    counts[key] = images.length;
    console.log(`${key}: ${images.length} images`);
  }

  let unIdx = 0;
  for (const u of stillUnassigned) {
    unIdx += 1;
    const nn = String(unIdx).padStart(2, "0");
    await exportJpeg(u.file, path.join(UNASSIGNED_DIR, `${nn}.jpg`));
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");

  return { manifest, counts, unassigned: stillUnassigned.length };
}

async function main() {
  const { counts, unassigned } = await buildGalleries();
  console.log("\nGallery counts:", counts);
  console.log("Unassigned:", unassigned);
  console.log("Manifest:", MANIFEST_PATH);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
