import { prisma } from "@/lib/db";

const CAT_CODE: Record<string, string> = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

/** Normalize a SKU segment: BL-SW-001, BLUE, L → safe uppercase token. */
export function normalizeSkuPart(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fashion convention (style + colour + size):
 * product article BL-SW-001 + blue + L → BL-SW-001-BLUE-L
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

/** Next free style article for a category (does not write). */
export async function peekNextProductSku(category: string): Promise<string> {
  const prefix = categorySkuPrefix(category);
  const existing = await prisma.product.findMany({
    where: { sku: { startsWith: prefix } },
    select: { sku: true },
  });
  let max = 0;
  for (const row of existing) {
    const n = Number(row.sku?.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

/**
 * Style-level article: unique Product.sku.
 * Prefer manual value when provided; otherwise allocate BL-{CAT}-NNN.
 */
export async function allocateProductSku(
  category: string,
  preferred?: string | null,
  excludeProductId?: string
): Promise<string> {
  const manual = preferred?.trim()
    ? normalizeSkuPart(preferred)
    : "";
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
  return peekNextProductSku(category);
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
