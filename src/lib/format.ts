export function formatUAH(amount: number): string {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(amount);
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
