import { colorNameFromKey, paletteColorForKey } from "@/lib/color-palette";
import type { Product, ProductColor } from "@/lib/types";

/** Storefront is Ukrainian-only; prefer *Uk with fallback to primary fields. */
export function localizedProductName(
  product: Pick<Product, "name" | "nameUk">
): string {
  return product.nameUk || product.name;
}

export function localizedProductDescription(
  product: Pick<Product, "description" | "descriptionUk">
): string {
  return product.descriptionUk || product.description;
}

export function localizedProductDetails(
  product: Pick<Product, "details" | "detailsUk">
): string[] {
  if (product.detailsUk?.length) return product.detailsUk;
  return product.details;
}

/** Buyer-facing color label: stored UA name, else palette from key (black → Чорний). */
export function localizedColorName(color: ProductColor): string {
  const stored = (color.nameUk || color.name || "").trim();
  const fromKey = paletteColorForKey(color.id);
  if (fromKey) {
    // Prefer palette UA when stored name is empty or just the raw english key
    if (
      !stored ||
      stored.toLowerCase() === color.id.toLowerCase() ||
      stored.toLowerCase() === fromKey.key
    ) {
      return fromKey.name;
    }
  }
  return stored || colorNameFromKey(color.id);
}

export function localizedFigure(
  product: Pick<Product, "figure" | "figureUk">
): string | undefined {
  return product.figureUk || product.figure || undefined;
}

/** Normalize for UA typos / latin transliteration in search. */
export function normalizeSearchQuery(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[''`ʼ]/g, "")
    .replace(/sch/g, "sh")
    .replace(/kh/g, "h")
    .replace(/\s+/g, " ")
    .trim();
}

/** Card title only — what the customer actually reads in the list. */
function productCardTitleText(product: Product): string {
  return normalizeSearchQuery(localizedProductName(product));
}

/** Extra identity fields for longer queries (леся, ліна, stus…). */
function productExtendedText(product: Product): string {
  return normalizeSearchQuery(
    [
      product.nameUk ?? "",
      product.name,
      product.figureUk ?? "",
      product.figure ?? "",
      product.slug,
      product.sku ?? "",
      ...(product.tags ?? []),
    ].join(" ")
  );
}

export function productSearchText(product: Product): string {
  return productExtendedText(product);
}

/**
 * Storefront search:
 * - 1–2 characters → only the visible product title (e.g. «Светр Костенко»),
 *   so «л» does not hit via «Ліна» / «Василь» in figure fields.
 * - 3+ characters → title + figure + slug + tags (UA/EN).
 */
export function productMatchesQuery(product: Product, q: string): boolean {
  const needle = normalizeSearchQuery(q);
  if (!needle) return false;
  if (productCardTitleText(product).includes(needle)) return true;
  const sku = normalizeSearchQuery(product.sku ?? "");
  if (sku && sku.includes(needle)) return true;
  if (needle.length >= 3 && productExtendedText(product).includes(needle)) {
    return true;
  }
  return false;
}
