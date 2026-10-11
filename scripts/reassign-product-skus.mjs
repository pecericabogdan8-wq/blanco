/**
 * Reassign every product style SKU to a fresh random BL-{CAT}-NNNNNN
 * and rebuild variant codes. Old SKUs stay reserved in SkuRegistry forever.
 */
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

async function isTaken(sku) {
  const normalized = normalizeSkuPart(sku);
  const onProduct = await prisma.product.findFirst({
    where: { sku: normalized },
    select: { id: true },
  });
  if (onProduct) return true;
  const onReg = await prisma.skuRegistry.findUnique({
    where: { sku: normalized },
    select: { sku: true },
  });
  return Boolean(onReg);
}

async function allocate(category) {
  const code = CAT_CODE[category] ?? "XX";
  const prefix = `BL-${code}-`;
  for (let i = 0; i < 64; i++) {
    const candidate = `${prefix}${randomInt(100000, 1000000)}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  throw new Error("Could not allocate unique SKU");
}

const products = await prisma.product.findMany({
  include: { colors: true, variants: true },
  orderBy: { createdAt: "asc" },
});

for (const product of products) {
  const oldSku = product.sku ? normalizeSkuPart(product.sku) : "";
  const newSku = await allocate(product.category);

  await prisma.product.update({
    where: { id: product.id },
    data: { sku: newSku },
  });

  // Keep old article banned forever (orders / archives may still reference it)
  if (oldSku && oldSku !== newSku) {
    await reserve(oldSku, "product", product.id);
  }
  await reserve(newSku, "product", product.id);

  const colorById = new Map(product.colors.map((c) => [c.id, c.key]));
  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    if (!colorKey) continue;
    const oldVar = v.sku ? normalizeSkuPart(v.sku) : "";
    const next = buildVariantSku(newSku, colorKey, v.size);
    if (oldVar && oldVar !== next) {
      await reserve(oldVar, "variant", v.id);
    }
    await prisma.productVariant.update({
      where: { id: v.id },
      data: { sku: next },
    });
    await reserve(next, "variant", v.id);
  }

  console.log(
    `${product.slug}: ${oldSku || "(empty)"} → ${newSku} (${product.variants.length} variants)`
  );
}

console.log(
  `Done. ${products.length} products. Registry: ${await prisma.skuRegistry.count()}`
);
await prisma.$disconnect();
