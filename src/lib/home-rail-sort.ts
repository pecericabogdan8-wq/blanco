import { isBestseller, isProductNew } from "@/lib/product-badges";
import type { Product } from "@/lib/types";

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Stable primary compare; equal keys → random among ties. */
function sortByKey<T>(items: T[], key: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, k: key(item), r: Math.random() }))
    .sort((a, b) => (a.k !== b.k ? a.k - b.k : a.r - b.r))
    .map((x) => x.item);
}

function discountPct(p: Product): number {
  if (p.salePrice == null || p.salePrice >= p.price || p.price <= 0) return 0;
  return ((p.price - p.salePrice) / p.price) * 100;
}

function onSale(p: Product): boolean {
  return discountPct(p) > 0;
}

/**
 * Home rail:
 * 1) bestsellers by units sold ↓ (ties random)
 * 2) sale by discount % ↓ (ties random)
 * 3) new by createdAt ↓ (ties random)
 * 4) rest random
 * One tier per product (bestseller > sale > new > rest).
 */
export function sortHomeRailProducts(
  products: Product[],
  bestsellerIds: string[],
  soldById: Record<string, number> = {}
): Product[] {
  if (products.length === 0) return [];

  const bestsellers: Product[] = [];
  const sales: Product[] = [];
  const news: Product[] = [];
  const rest: Product[] = [];

  for (const p of products) {
    if (isBestseller(p.id, bestsellerIds)) bestsellers.push(p);
    else if (onSale(p)) sales.push(p);
    else if (isProductNew(p)) news.push(p);
    else rest.push(p);
  }

  const bySold = sortByKey(bestsellers, (p) => -(soldById[p.id] ?? 0));
  const byDiscount = sortByKey(sales, (p) => -discountPct(p));
  const byNew = sortByKey(news, (p) =>
    p.createdAt ? -new Date(p.createdAt).getTime() : 0
  );

  return [...bySold, ...byDiscount, ...byNew, ...shuffle(rest)];
}
