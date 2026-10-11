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
 * Unique per sellable unit; product.sku stays unique at style level.
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
 * Random unique style article: BL-{CAT}-{6 digits}.
 * Not sequential — delete/create never “fills gaps” or reuses a pattern.
 * Clash check covers all products (incl. trash), so soft-deleted SKUs stay reserved.
 */
export async function peekNextProductSku(
  category: string,
  excludeProductId?: string
): Promise<string> {
  const prefix = categorySkuPrefix(category);
  for (let attempt = 0; attempt < 48; attempt++) {
    const candidate = `${prefix}${randomInt(100000, 1000000)}`;
    const clash = await prisma.product.findFirst({
      where: {
        sku: candidate,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (!clash) return candidate;
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
    const clash = await prisma.product.findFirst({
      where: {
        sku: manual,
        ...(excludeProductId ? { NOT: { id: excludeProductId } } : {}),
      },
      select: { id: true },
    });
    if (clash) throw new Error(`Артикул «${manual}» уже зайнятий`);
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

  for (const v of product.variants) {
    const colorKey = colorById.get(v.colorId);
    if (!colorKey) continue;
    const next = buildVariantSku(base, colorKey, v.size);
    if (v.sku === next) continue;
    const clash = await prisma.productVariant.findFirst({
      where: { sku: next, NOT: { id: v.id } },
      select: { id: true },
    });
    if (clash) {
      throw new Error(`Код варіанту «${next}» уже зайнятий`);
    }
    await prisma.productVariant.update({
      where: { id: v.id },
      data: { sku: next },
    });
  }
}
