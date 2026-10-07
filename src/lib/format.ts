/** Stable currency formatting (avoids SSR/client Intl symbol mismatch: ₴ vs грн). */
export function formatUAH(amount: number): string {
  const formatted = new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} грн`;
}

export function productPrice(price: number, salePrice?: number) {
  const current = salePrice ?? price;
  const onSale = salePrice != null && salePrice < price;
  return { current, onSale, original: price };
}

export function stockFor(
  inventory: Record<string, number>,
  colorId: string,
  size: string
) {
  return inventory[`${colorId}:${size}`] ?? 0;
}

export function totalStock(inventory: Record<string, number>) {
  return Object.values(inventory).reduce((a, b) => a + b, 0);
}
