/** NEW badge: only if created within last N days. */
export const NEW_ARRIVAL_DAYS = 30;

/** BESTSELLER badge for top N by units sold. */
export const BESTSELLER_TOP_N = 3;

export function isProductNew(product: { createdAt?: string }): boolean {
  if (!product.createdAt) return false;
  const ageMs = Date.now() - new Date(product.createdAt).getTime();
  return ageMs >= 0 && ageMs < NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

export function isBestseller(
  productId: string,
  bestsellerIds: string[],
  topN = BESTSELLER_TOP_N
): boolean {
  return bestsellerIds.slice(0, topN).includes(productId);
}
