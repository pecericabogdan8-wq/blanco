/**
 * Build product galleries from curated seed lists + nearest-neighbor expansion
 * on bright studio shots only (lifestyle/group → lookbook).
 *
 * Usage: npx tsx scripts/manual-galleries.ts
 */
import fs from "fs";
import path from "path";
import sharp from "sharp";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "items");
const OUT = path.join(ROOT, "public", "products", "galleries");
const MANIFEST = path.join(OUT, "manifest.json");

const MAX_EDGE = 2200;
const JPEG_Q = 92;
const THUMB = 40;
const MAX_DIST = 280_000;

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
  | "lookbook";

/** Curated seeds — filenames without extension matching. */
const SEEDS: Record<Key, string[]> = {
  lesya: ["IMG_8790", "IMG_8791", "IMG_8796", "IMG_8798"],
  // white Stus
  stus: [
    "IMG_3154",
    "IMG_3155",
    "IMG_3168",
    "IMG_3189",
    "IMG_3190",
    "IMG_3063",
    "IMG_3102",
    "IMG_3169",
    "IMG_3180",
    "IMG_3182",
    "IMG_3183",
    "IMG_3184",
    "IMG_3185",
    "IMG_3186",
    "IMG_3187",
    "IMG_3188",
  ],
  // red Chornovil
  chornovil: [
    "IMG_3150",
    "IMG_3151",
    "IMG_3170",
    "IMG_3171",
    "IMG_3232",
    "IMG_3233",
    "IMG_3062",
    "IMG_3226",
    "IMG_3228",
    "IMG_3229",
  ],
  // black + red outline Kuzma sweater (long sleeve — curated only)
  kuzma: [
    "IMG_3216",
    "IMG_3217",
    "IMG_3160",
    "IMG_3161",
    "IMG_3156",
    "IMG_3157",
    "IMG_3320",
    "IMG_3321",
    "IMG_3322",
  ],
  // black + white outline Kostenko
  kostenko: [
    "IMG_3174",
    "IMG_3103",
    "IMG_3104",
    "IMG_3106",
    "IMG_3218",
    "IMG_3219",
    "IMG_3220",
    "IMG_3221",
    "IMG_3222",
    "IMG_3225",
    "IMG_3243",
    "IMG_3244",
    "IMG_3247",
    "IMG_3248",
    "IMG_3249",
    "IMG_3250",
  ],
  // milk/beige Shevchenko
  shevchenko: [
    "IMG_3059",
    "IMG_3101",
    "IMG_3152",
    "IMG_3153",
    "IMG_3196",
    "IMG_3197",
    "IMG_3198",
    "IMG_3201",
    "IMG_3202",
    "IMG_3203",
    "IMG_3204",
    "IMG_3205",
  ],
  // second beige figure (Symonenko) — fill via NN from leftover beige
  symonenko: [],
  lobanovskyi: ["photo_2026-10-08_15-46-55", "photo_2026-10-08_15-47-12"],
  "freedom-scarf": [
    "IMG_3162",
    "IMG_3163",
    "IMG_3300",
    "IMG_3166",
  ],
  // Kuzma tee (short sleeve, KUZMA lettering)
  "kuzma-tee": [
    "IMG_3061",
    "IMG_3172",
    "IMG_3173",
    "IMG_3175",
    "IMG_3323",
    "IMG_3324",
    "IMG_3325",
    "IMG_3326",
    "IMG_3327",
    "IMG_3328",
    "IMG_3329",
    "IMG_3330",
    "IMG_3331",
    "IMG_3332",
  ],
  // washed script tees (non-KUZMA) — fill from lookbook later if found
  "washed-tee": [],
  lookbook: [
    "IMG_3095",
    "IMG_3100",
    "IMG_3167",
    "IMG_3123",
    "IMG_3298",
    "IMG_3299",
    "IMG_3297",
  ],
};

function resolveFile(stem: string): string | null {
  for (const ext of [".JPG", ".JPEG", ".PNG", ".jpg", ".jpeg", ".png", ".webp"]) {
    const p = path.join(SRC, stem + ext);
    if (fs.existsSync(p)) return p;
  }
  // stem might already include weird names
  const direct = path.join(SRC, stem);
  if (fs.existsSync(direct)) return direct;
  return null;
}

async function thumb(file: string) {
  return sharp(file)
    .rotate()
    .resize(THUMB, THUMB, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer();
}

function l1(a: Buffer, b: Buffer) {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
  return s;
}

async function isStudio(file: string) {
  const { data, info } = await sharp(file)
    .rotate()
    .resize(60, 75, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let bg = 0;
  let n = 0;
  for (const [x, y] of [
    [2, 2],
    [57, 2],
    [2, 72],
    [57, 72],
  ] as const) {
    const i = (y * info.width + x) * 3;
    bg += (data[i] + data[i + 1] + data[i + 2]) / 3;
    n++;
  }
  return bg / n > 165;
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
    .jpeg({ quality: JPEG_Q, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(dest);
}

async function main() {
  const allFiles = fs
    .readdirSync(SRC)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .map((f) => path.join(SRC, f));

  const assigned = new Map<string, Key>(); // basename → key
  const buckets = new Map<Key, string[]>();

  function add(key: Key, file: string) {
    const base = path.basename(file);
    if (assigned.has(base)) return;
    assigned.set(base, key);
    const list = buckets.get(key) ?? [];
    list.push(file);
    buckets.set(key, list);
  }

  // 1) Curated seeds
  for (const [key, stems] of Object.entries(SEEDS) as [Key, string[]][]) {
    for (const stem of stems) {
      const f = resolveFile(stem);
      if (f) add(key, f);
      else console.warn("missing seed", key, stem);
    }
  }

  // 2) Build centroids from assigned seeds
  const centroids = new Map<Key, Buffer[]>();
  for (const [key, files] of buckets) {
    if (key === "lookbook") continue;
    const vecs: Buffer[] = [];
    for (const f of files) {
      try {
        vecs.push(await thumb(f));
      } catch {
        /* skip */
      }
    }
    if (vecs.length) centroids.set(key, vecs);
  }

  function nearest(vec: Buffer): { key: Key; dist: number } | null {
    let best: Key | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const [key, vecs] of centroids) {
      for (const c of vecs) {
        const d = l1(vec, c);
        if (d < bestDist) {
          bestDist = d;
          best = key;
        }
      }
    }
    return best ? { key: best, dist: bestDist } : null;
  }

  // 3) Expand ONLY safe light-color products (studio). Never auto-expand
  // black/tee buckets — those stay curated-only (NN confuses kuzma sweater vs tee).
  const expandable = new Set<Key>([
    "stus",
    "shevchenko",
    "chornovil",
    "freedom-scarf",
    "lobanovskyi",
    "symonenko",
  ]);

  for (const file of allFiles) {
    const base = path.basename(file);
    if (assigned.has(base)) continue;
    try {
      const studio = await isStudio(file);
      if (!studio) {
        add("lookbook", file);
        continue;
      }
      const vec = await thumb(file);
      const hit = nearest(vec);
      if (hit && expandable.has(hit.key) && hit.dist <= MAX_DIST * 0.75) {
        add(hit.key, file);
      } else {
        add("lookbook", file);
      }
    } catch {
      add("lookbook", file);
    }
  }

  // Force Lesya = exactly the 4 pink studio shots
  buckets.set(
    "lesya",
    SEEDS.lesya.map((s) => resolveFile(s)).filter((x): x is string => !!x)
  );

  // 5) Export galleries
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const manifest: Record<
    string,
    { images: string[]; primary: string; sources: string[] }
  > = {};
  const counts: Record<string, number> = {};

  const order: Key[] = [
    "lesya",
    "stus",
    "chornovil",
    "kuzma",
    "kostenko",
    "shevchenko",
    "symonenko",
    "lobanovskyi",
    "freedom-scarf",
    "kuzma-tee",
    "washed-tee",
    "lookbook",
  ];

  for (const key of order) {
    const files = (buckets.get(key) ?? []).slice().sort();
    // dedupe
    const uniq = [...new Set(files)];
    if (!uniq.length) {
      counts[key] = 0;
      continue;
    }
    const dir = path.join(OUT, key);
    fs.mkdirSync(dir, { recursive: true });
    const images: string[] = [];
    const sources: string[] = [];
    let i = 0;
    for (const file of uniq) {
      i++;
      const nn = String(i).padStart(2, "0");
      await exportJpeg(file, path.join(dir, `${nn}.jpg`));
      if (key !== "lookbook") {
        images.push(`/products/galleries/${key}/${nn}.jpg`);
        sources.push(`items/${path.basename(file)}`);
      }
    }
    counts[key] = uniq.length;
    if (key !== "lookbook" && images.length) {
      manifest[key] = { images, primary: images[0], sources };
    }
    console.log(`${key}: ${uniq.length}`);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log("manifest written", MANIFEST);
  console.log("counts", counts);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
