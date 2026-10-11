import { randomInt } from "crypto";
import { prisma } from "@/lib/db";

const CAT_CODE: Record<string, string> = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

/** Normalize a SKU segment: BL-SW-482917, BLUE, L → safe uppercase token. */
export function normalizeSkuPart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fashion convention (style + colour + size):
 * product article BL-SW-482917 + blue + L → BL-SW-482917-BLUE-L
 */
export function buildVariantSku(
  productSku: string,
  colorKey: string,
  size: string
): string {
  const style = normalizeSkuPart(productSku);
  const color = normalizeSkuPart(colorKey);
  const sz = normalizeSkuPart(size);
  return [style, color, sz].filter(Boolean).join("-");
}

export function categorySkuPrefix(category: string): string {
  const code = CAT_CODE[category] ?? "XX";
  return `BL-${code}-`;
}

/**
 * True if SKU is used by any live/trash product OR forever-banned in SkuRegistry
 * (incl. hard-deleted). `excludeProductId` allows keeping the same article on edit.
 */
export async function isProductSkuTaken(
  sku: string,
  excludeProductId?: string
): Promise<boolean> {
  const normalized = normalizeSkuPart(sku);
  if (!normalized) return false;

  const onProduct = await prisma.product.findFirst({
    where: {
      sku: normalized,
      ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
    },
    select: { id: true },
  });
  if (onProduct) return true;

  const reg = await prisma.skuRegistry.findUnique({
    where: { sku: normalized },
    select: { refId: true, kind: true },
  });
  if (!reg) return false;
  if (
    excludeProductId &&
    reg.kind === "product" &&
    reg.refId === excludeProductId
  ) {
    return false;
  }
  return true;
}

export async function reserveSku(
  sku: string,
  kind: "product" | "variant",
  refId?: string | null
): Promise<void> {
  const normalized = normalizeSkuPart(sku);
  if (!normalized) return;
  await prisma.skuRegistry.upsert({
    where: { sku: normalized },
    create: { sku: normalized, kind, refId: refId ?? null },
    update: {
      kind,
      ...(refId != null ? { refId } : {}),
    },
  });
}

/** Register style + all variant codes for a product (create/edit/hard-delete). */
export async function reserveProductSkuSet(productId: string): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { colors: true, variants: true },
  });
  if (!product) return;

  if (product.sku) {
    await reserveSku(product.sku, "product", product.id);
  }

  const colorById = new Map(product.colors.map((c) => [c.id, c.key]));
  const base = product.sku || normalizeSkuPart(product.slug);
  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    const code =
      v.sku ||
      (colorKey ? buildVariantSku(base, colorKey, v.size) : null);
    if (!code) continue;
    await reserveSku(code, "variant", v.id);
  }
}

/**
 * Random unique style article: BL-{CAT}-{6 digits}.
 * Checks live products + forever SkuRegistry (trash & hard-deleted).
 */
export async function peekNextProductSku(
  category: string,
  excludeProductId?: string
): Promise<string> {
  const prefix = categorySkuPrefix(category);
  for (let attempt = 0; attempt < 48; attempt++) {
    const candidate = `${prefix}${randomInt(100000, 1000000)}`;
    if (!(await isProductSkuTaken(candidate, excludeProductId))) {
      return candidate;
    }
  }
  throw new Error("Не вдалося згенерувати унікальний артикул — спробуйте ще раз");
}

/**
 * Style-level article: unique Product.sku.
 * Prefer manual value when provided; otherwise random BL-{CAT}-NNNNNN.
 */
export async function allocateProductSku(
  category: string,
  preferred?: string | null,
  excludeProductId?: string
): Promise<string> {
  const manual = preferred?.trim() ? normalizeSkuPart(preferred) : "";
  if (manual) {
    if (await isProductSkuTaken(manual, excludeProductId)) {
      throw new Error(`Артикул «${manual}» уже зайнятий`);
    }
    return manual;
  }
  return peekNextProductSku(category, excludeProductId);
}

/** Keep ProductVariant.sku in sync with style article + colour + size. */
export async function syncProductVariantSkus(productId: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: { colors: true, variants: true },
  });
  const base = product.sku || normalizeSkuPart(product.slug);
  const colorById = new Map(product.colors.map((c) => [c.id, c.key]));

  if (product.sku) {
    await reserveSku(product.sku, "product", product.id);
  }

  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    if (!colorKey) continue;
    const next = buildVariantSku(base, colorKey, v.size);
    if (v.sku !== next) {
      const clashVar = await prisma.productVariant.findFirst({
        where: { sku: next, NOT: { id: v.id } },
        select: { id: true },
      });
      const clashReg = await prisma.skuRegistry.findUnique({
        where: { sku: next },
        select: { refId: true },
      });
      if (clashVar || (clashReg && clashReg.refId !== v.id)) {
        throw new Error(`Код варіанту «${next}» уже зайнятий`);
      }
      await prisma.productVariant.update({
        where: { id: v.id },
        data: { sku: next },
      });
    }
    await reserveSku(next, "variant", v.id);
  }
}
