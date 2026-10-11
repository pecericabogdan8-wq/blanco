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

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "ONE"] as const;

function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a as (typeof SIZE_ORDER)[number]);
    const ib = SIZE_ORDER.indexOf(b as (typeof SIZE_ORDER)[number]);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

/**
 * In-stock color → sizes only (qty > 0). Used in admin cards / filters.
 */
export function availableColorSizes(
  colors: { id: string; name: string; nameUk?: string; hex: string }[],
  inventory: Record<string, number>
): { id: string; name: string; hex: string; sizes: string[] }[] {
  return colors
    .map((c) => {
      const sizes = sortSizes(
        Object.entries(inventory)
          .filter(([key, qty]) => key.startsWith(`${c.id}:`) && qty > 0)
          .map(([key]) => key.slice(c.id.length + 1))
          .filter(Boolean)
      );
      return {
        id: c.id,
        name: c.nameUk || c.name,
        hex: c.hex,
        sizes,
      };
    })
    .filter((c) => c.sizes.length > 0);
}
