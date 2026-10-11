import type {
  Product as DbProduct,
  ProductColor as DbColor,
  ProductImage,
  ProductVariant,
} from "@prisma/client";
import { sortSizes } from "@/lib/format";
import type { Product, ProductSize } from "@/lib/types";
import { cleanImageSrc, versionedImageSrc } from "@/lib/product-images";

type DbProductFull = DbProduct & {
  colors: DbColor[];
  variants: ProductVariant[];
  images: ProductImage[];
};

function parseJsonArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? (v as string[]) : [];
  } catch {
    return [];
  }
}

export function mapProduct(p: DbProductFull): Product {
  const colors = [...p.colors]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.key,
      name: c.name,
      nameUk: c.nameUk || undefined,
      hex: c.hex,
    }));

  const sizeSet = new Set<string>();
  const inventory: Record<string, number> = {};
  for (const v of p.variants) {
    const color = p.colors.find((c) => c.id === v.colorId);
    if (!color) continue;
    sizeSet.add(v.size);
    inventory[`${color.key}:${v.size}`] = v.stock;
  }

  const sizes = sortSizes([...sizeSet]) as ProductSize[];

  const version = p.updatedAt.getTime();
  const orderedImages = [...p.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const rawUrls = orderedImages.map((img) => img.url);

  const detailsUk = parseJsonArray(p.detailsUk);

  let sizeChart: Product["sizeChart"];
  if (p.sizeChart) {
    try {
      const rows = JSON.parse(p.sizeChart) as NonNullable<Product["sizeChart"]>;
      if (Array.isArray(rows)) {
        const rank = new Map(
          sortSizes(rows.map((r) => String(r.size))).map((s, i) => [s, i])
        );
        sizeChart = [...rows].sort(
          (a, b) =>
            (rank.get(String(a.size).toUpperCase()) ?? 99) -
            (rank.get(String(b.size).toUpperCase()) ?? 99)
        );
      }
    } catch {
      sizeChart = undefined;
    }
  }

  return {
    id: p.id,
    slug: p.slug,
    sku: p.sku || undefined,
    name: p.name,
    nameUk: p.nameUk || undefined,
    category: p.category as Product["category"],
    description: p.description,
    descriptionUk: p.descriptionUk || undefined,
    details: parseJsonArray(p.details),
    detailsUk: detailsUk.length ? detailsUk : undefined,
    price: p.price,
    salePrice: p.salePrice ?? undefined,
    figure: p.figure ?? undefined,
    figureUk: p.figureUk ?? undefined,
    featured: p.featured,
    newArrival: p.newArrival,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
    tags: parseJsonArray(p.tags),
    images: rawUrls.map((src) =>
      versionedImageSrc(cleanImageSrc(src), version)
    ),
    sizeChart,
    colors,
    sizes,
    inventory,
  };
}

export const productInclude = {
  colors: true,
  variants: true,
  images: { orderBy: { sortOrder: "asc" as const } },
} as const;
