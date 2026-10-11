import { randomInt } from "crypto";
import { PrismaClient } from "@prisma/client";

const CAT_CODE = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

const prisma = new PrismaClient();

function normalizeSkuPart(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildVariantSku(productSku, colorKey, size) {
  return [productSku, colorKey, size]
    .map(normalizeSkuPart)
    .filter(Boolean)
    .join("-");
}

async function reserve(sku, kind, refId) {
  const normalized = normalizeSkuPart(sku);
  if (!normalized) return;
  await prisma.skuRegistry.upsert({
    where: { sku: normalized },
    create: { sku: normalized, kind, refId: refId ?? null },
    update: { kind, refId: refId ?? null },
  });
}

async function allocate(category) {
  const code = CAT_CODE[category] ?? "XX";
  const prefix = `BL-${code}-`;
  for (let i = 0; i < 48; i++) {
    const candidate = `${prefix}${randomInt(100000, 1000000)}`;
    const onProduct = await prisma.product.findFirst({
      where: { sku: candidate },
      select: { id: true },
    });
    if (onProduct) continue;
    const onReg = await prisma.skuRegistry.findUnique({
      where: { sku: candidate },
      select: { sku: true },
    });
    if (onReg) continue;
    return candidate;
  }
  throw new Error("Could not allocate unique SKU");
}

const missing = await prisma.product.findMany({
  where: { OR: [{ sku: null }, { sku: "" }] },
  select: { id: true, category: true, slug: true },
  orderBy: { createdAt: "asc" },
});

for (const p of missing) {
  const sku = await allocate(p.category);
  await prisma.product.update({ where: { id: p.id }, data: { sku } });
  console.log(`style ${p.slug} → ${sku}`);
}

const products = await prisma.product.findMany({
  include: { colors: true, variants: true },
});

for (const product of products) {
  const base = product.sku || normalizeSkuPart(product.slug);
  if (product.sku) await reserve(product.sku, "product", product.id);

  const colorById = new Map(product.colors.map((c) => [c.id, c.key]));
  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    if (!colorKey) continue;
    const next = buildVariantSku(base, colorKey, v.size);
    if (v.sku !== next) {
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { sku: next },
      });
      console.log(`variant ${v.id} → ${next}`);
    }
    await reserve(next, "variant", v.id);
  }
}

const archives = await prisma.productArchive.findMany({
  select: { productId: true, snapshot: true },
});

for (const row of archives) {
  let snap;
  try {
    snap = JSON.parse(row.snapshot);
  } catch {
    continue;
  }
  if (snap?.sku) await reserve(snap.sku, "product", row.productId);
  const colors = Array.isArray(snap?.colors) ? snap.colors : [];
  const variants = Array.isArray(snap?.variants) ? snap.variants : [];
  const colorById = new Map(colors.map((c) => [c.id, c.key]));
  const base = snap?.sku || normalizeSkuPart(snap?.slug ?? "");
  for (const v of variants) {
    const colorKey = colorById.get(v.colorId);
    const code =
      v.sku ||
      (colorKey && base ? buildVariantSku(base, colorKey, v.size) : null);
    if (code) await reserve(code, "variant", v.id);
  }
}

console.log(
  `Done. Registry size: ${await prisma.skuRegistry.count()}`
);
await prisma.$disconnect();
