import { prisma } from "@/lib/db";
import { mapProduct, productInclude } from "@/lib/product-mapper";
import { cleanImageList } from "@/lib/product-images";
import { productMatchesQuery } from "@/lib/localize-product";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { allocateProductSku } from "@/lib/sku";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q")?.toLowerCase();
    const inStock = searchParams.get("inStock") === "1";
    const onSale = searchParams.get("onSale") === "1";
    const includeInactive = searchParams.get("all") === "1";
    const trashOnly = searchParams.get("trash") === "1";
    if (includeInactive || trashOnly) await requireAdmin();

    const products = await prisma.product.findMany({
      where: {
        ...(trashOnly
          ? { active: false }
          : includeInactive
            ? {}
            : { active: true }),
        ...(category && category !== "all" ? { category } : {}),
        ...(onSale ? { salePrice: { not: null } } : {}),
      },
      include: productInclude,
      // Ranking for «Популярні» is sales-based on the client; DB default = newest
      orderBy: [{ createdAt: "desc" }],
    });

    let mapped = products.map(mapProduct);

    if (q) {
      mapped = mapped.filter((p) => productMatchesQuery(p, q));
    }

    if (inStock) {
      mapped = mapped.filter((p) =>
        Object.values(p.inventory).some((n) => n > 0)
      );
    }

    if (onSale) {
      mapped = mapped.filter(
        (p) => p.salePrice != null && p.salePrice < p.price
      );
    }

    return jsonOk({ ok: true, products: mapped });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const {
      name,
      nameUk = "",
      slug,
      sku,
      category,
      description,
      descriptionUk = "",
      details = [],
      detailsUk = [],
      price,
      salePrice,
      figure,
      figureUk,
      featured = false,
      newArrival = false,
      tags = [],
      images = [],
      sizeChart,
      colors = [],
      sizes = [],
      stock = 0,
      stockBySize,
      inventory,
    } = body;

    if (!name || !slug || !category || !description || price == null || price === "") {
      return jsonError("name, slug, category, description, price required");
    }

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return jsonError("Ціна має бути більше 0");
    }

    let saleNum: number | null =
      salePrice == null || salePrice === "" ? null : Number(salePrice);
    if (saleNum != null) {
      if (!Number.isFinite(saleNum) || saleNum <= 0) {
        return jsonError("Sale ціна має бути більше 0 або порожня");
      }
      if (saleNum >= priceNum) {
        return jsonError("Sale ціна має бути меншою за звичайну ціну");
      }
    }

    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) return jsonError("Slug already exists", 409);

    let skuValue: string;
    try {
      skuValue = await allocateProductSku(String(category), sku);
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "SKU error", 409);
    }

    const imageUrls = cleanImageList(images as string[]);
    const colorList = (
      colors as {
        id?: string;
        key?: string;
        name: string;
        nameUk?: string;
        hex: string;
      }[]
    ).filter((c) => c.name && (c.id || c.key) && c.hex);
    if (!colorList.length) {
      return jsonError("Додайте хоча б один колір");
    }

    const product = await prisma.product.create({
      data: {
        name: String(name),
        nameUk: String(nameUk),
        slug,
        sku: skuValue,
        category,
        description: String(description),
        descriptionUk: String(descriptionUk),
        details: JSON.stringify(details),
        detailsUk: JSON.stringify(detailsUk),
        price: priceNum,
        salePrice: saleNum,
        figure: figure || null,
        figureUk: figureUk || null,
        featured: Boolean(featured),
        newArrival: Boolean(newArrival),
        tags: JSON.stringify(tags),
        sizeChart: sizeChart ? JSON.stringify(sizeChart) : null,
        active: true,
        images: {
          create: imageUrls.map((url, i) => ({
            url,
            sortOrder: i,
            alt: String(name),
          })),
        },
        colors: {
          create: colorList.map((c, i) => ({
            key: String(c.id || c.key)
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9_-]/g, ""),
            name: c.name,
            nameUk: c.nameUk ?? c.name,
            hex: c.hex,
            sortOrder: i,
          })),
        },
      },
      include: { colors: true },
    });

    const sizeList = (sizes as string[]).length
      ? (sizes as string[]).map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : ["M"];
    const defaultStock = Math.max(0, Number(stock) || 0);
    const bySize =
      stockBySize && typeof stockBySize === "object"
        ? (stockBySize as Record<string, number>)
        : null;
    const invMap =
      inventory && typeof inventory === "object"
        ? (inventory as Record<string, number>)
        : null;

    for (const color of product.colors) {
      for (const size of sizeList) {
        const invKey = `${color.key}:${size}`;
        const qty = invMap?.[invKey] ?? bySize?.[size] ?? defaultStock;
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: color.id,
            size,
            stock: Math.max(0, Number(qty) || 0),
            sku: `${slug}-${color.key}-${size}`.toUpperCase(),
          },
        });
      }
    }

    const full = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: productInclude,
    });
    return jsonOk({ ok: true, product: mapProduct(full) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
