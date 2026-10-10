import type { Product } from "@/lib/types";
import { stockFor } from "@/lib/format";

const RELATED_LIMIT = 4;

function hasAnyStock(p: Product): boolean {
  return p.colors.some((c) =>
    p.sizes.some((s) => stockFor(p.inventory, c.id, s) > 0)
  );
}

function tagSet(p: Product): Set<string> {
  return new Set((p.tags ?? []).map((t) => t.toLowerCase().trim()).filter(Boolean));
}

function sharedTagCount(a: Product, b: Product): number {
  const tagsB = tagSet(b);
  let n = 0;
  for (const t of tagSet(a)) {
    if (tagsB.has(t)) n += 1;
  }
  return n;
}

function sameFigure(a: Product, b: Product): boolean {
  const af = (a.figureUk || a.figure || "").toLowerCase().trim();
  const bf = (b.figureUk || b.figure || "").toLowerCase().trim();
  if (!af || !bf) return false;
  return af === bf;
}

/**
 * Rank related products for PDP (deterministic, not random).
 *
 * Priority:
 * 1. Same cultural figure, other category (sweater → tee of same person)
 * 2. Same figure, same category
 * 3. Same category + shared tags
 * 4. Same category, in stock
 * 5. Fill: other categories with shared tags / in stock
 */
export function relatedProducts(
  current: Product,
  catalog: Product[],
  limit = RELATED_LIMIT
): Product[] {
  const others = catalog.filter((p) => p.id !== current.id);
  if (!others.length) return [];

  const scored = others.map((p) => {
    let score = 0;

    const figureMatch = sameFigure(current, p);
    const sameCat = p.category === current.category;
    const tags = sharedTagCount(current, p);
    const stocked = hasAnyStock(p);

    if (figureMatch && !sameCat) score += 100;
    if (figureMatch && sameCat) score += 80;
    if (sameCat) score += 40;
    score += tags * 12;
    if (stocked) score += 8;
    if (p.newArrival) score += 3;
    if (current.salePrice != null && p.salePrice != null) score += 4;
    // Prefer closer price band (±30%)
    const price = current.salePrice ?? current.price;
    const otherPrice = p.salePrice ?? p.price;
    if (price > 0) {
      const ratio = otherPrice / price;
      if (ratio >= 0.7 && ratio <= 1.3) score += 6;
    }

    return { p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.p.name.localeCompare(b.p.name, "uk");
  });

  // Prefer at least some same-category / same-figure picks before weak fillers
  const strong = scored.filter(
    (x) =>
      x.score >= 40 ||
      sameFigure(current, x.p) ||
      x.p.category === current.category
  );
  const weak = scored.filter((x) => !strong.includes(x));

  const picked: Product[] = [];
  for (const row of [...strong, ...weak]) {
    if (picked.length >= limit) break;
    picked.push(row.p);
  }
  return picked;
}
