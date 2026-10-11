import { randomInt } from "crypto";
import { PrismaClient } from "@prisma/client";

const CAT_CODE = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

const prisma = new PrismaClient();

function normalizeSkuPart(value) {
  return value
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

async function allocate(category) {
  const code = CAT_CODE[category] ?? "XX";
  const prefix = `BL-${code}-`;
  for (let i = 0; i < 48; i++) {
    const candidate = `${prefix}${randomInt(100000, 1000000)}`;
    const clash = await prisma.product.findFirst({
      where: { sku: candidate },
      select: { id: true },
    });
    if (!clash) return candidate;
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
  const colorById = new Map(product.colors.map((c) => [c.id, c.key]));
  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    if (!colorKey) continue;
    const next = buildVariantSku(base, colorKey, v.size);
    if (v.sku === next) continue;
    await prisma.productVariant.update({
      where: { id: v.id },
      data: { sku: next },
    });
    console.log(`variant ${v.id} → ${next}`);
  }
}

console.log("Done");
await prisma.$disconnect();
