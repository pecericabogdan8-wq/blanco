import { prisma } from "@/lib/db";
import { mapProduct, productInclude } from "@/lib/product-mapper";
import { cleanImageList } from "@/lib/product-images";
import { requireAdmin } from "@/lib/auth";
import { archiveProductBeforeDelete } from "@/lib/product-archive";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import {
  allocateProductSku,
  buildVariantSku,
  syncProductVariantSkus,
} from "@/lib/sku";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    // Allow inactive (trash) so order-history links still open PDP
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: productInclude,
    });
    if (!product) return jsonError("Product not found", 404);
    return jsonOk({ ok: true, product: mapProduct(product) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) return jsonError("Product not found", 404);

    const data: Record<string, unknown> = {};
    if (body.name != null) data.name = String(body.name);
    if (body.nameUk != null) data.nameUk = String(body.nameUk);
    if (body.slug != null) data.slug = String(body.slug);
    if (body.sku !== undefined) {
      const raw = String(body.sku ?? "").trim();
      if (!raw) {
        // Keep or allocate — never leave blank after edit
        try {
          data.sku = await allocateProductSku(
            String(body.category ?? existing.category),
            null,
            existing.id
          );
        } catch (e) {
          return jsonError(e instanceof Error ? e.message : "SKU error", 409);
        }
      } else {
        try {
          data.sku = await allocateProductSku(
            String(body.category ?? existing.category),
            raw,
            existing.id
          );
        } catch (e) {
          return jsonError(e instanceof Error ? e.message : "SKU error", 409);
        }
      }
    }
    if (body.category != null) data.category = String(body.category);
    if (body.description != null) data.description = String(body.description);
    if (body.descriptionUk != null)
      data.descriptionUk = String(body.descriptionUk);
    if (body.details != null) data.details = JSON.stringify(body.details);
    if (body.detailsUk != null) data.detailsUk = JSON.stringify(body.detailsUk);
    if (body.price != null) {
      const priceNum = Number(body.price);
      if (!Number.isFinite(priceNum) || priceNum <= 0) {
        return jsonError("Ціна має бути більше 0");
      }
      data.price = priceNum;
    }
    if (body.salePrice !== undefined) {
      if (body.salePrice == null || body.salePrice === "") {
        data.salePrice = null;
      } else {
        const saleNum = Number(body.salePrice);
        if (!Number.isFinite(saleNum) || saleNum <= 0) {
          return jsonError("Sale ціна має бути більше 0 або порожня");
        }
        const priceForCheck =
          body.price != null ? Number(body.price) : existing.price;
        if (saleNum >= priceForCheck) {
          return jsonError("Sale ціна має бути меншою за звичайну ціну");
        }
        data.salePrice = saleNum;
      }
    }
    if (body.figure !== undefined) data.figure = body.figure || null;
    if (body.figureUk !== undefined) data.figureUk = body.figureUk || null;
    if (body.featured != null) data.featured = Boolean(body.featured);
    if (body.newArrival != null) data.newArrival = Boolean(body.newArrival);
    if (body.active != null) data.active = Boolean(body.active);
    if (body.tags != null) data.tags = JSON.stringify(body.tags);
    if (body.sizeChart !== undefined) {
      data.sizeChart = body.sizeChart ? JSON.stringify(body.sizeChart) : null;
    }

    await prisma.product.update({ where: { id: existing.id }, data });

    // Sync colors: update / add / hard-delete removed keys (+ cascade variants)
    if (Array.isArray(body.colors)) {
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: existing.id },
        include: { colors: true, variants: true },
      });
      const incoming = body.colors as {
        id?: string;
        key?: string;
        name: string;
        nameUk?: string;
        hex: string;
      }[];
      const keepKeys = new Set<string>();
      let sortOrder =
        product.colors.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1;
      const sizes = [...new Set(product.variants.map((v) => v.size))];
      if (!sizes.length) sizes.push("M");

      for (const c of incoming) {
        const key = String(c.id || c.key || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "");
        const name = String(c.name ?? "").trim();
        const hex = String(c.hex ?? "#111111").trim();
        if (!key || !name) continue;
        keepKeys.add(key);
        const found = product.colors.find((x) => x.key === key);
        if (found) {
          await prisma.productColor.update({
            where: { id: found.id },
            data: {
              name,
              nameUk: String(c.nameUk ?? name),
              hex,
            },
          });
        } else {
          const color = await prisma.productColor.create({
            data: {
              productId: product.id,
              key,
              name,
              nameUk: String(c.nameUk ?? name),
              hex,
              sortOrder: sortOrder++,
            },
          });
          for (const size of sizes) {
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                colorId: color.id,
                size,
                stock: 0,
                sku: buildVariantSku(product.sku || product.slug, key, size),
              },
            });
          }
        }
      }

      const toRemove = product.colors.filter((x) => !keepKeys.has(x.key));
      if (toRemove.length && keepKeys.size > 0) {
        await prisma.productColor.deleteMany({
          where: { id: { in: toRemove.map((x) => x.id) } },
        });
      }
    }

    // Drop variant rows for sizes no longer in the product
    if (Array.isArray(body.sizes)) {
      const sizeList = (body.sizes as string[])
        .map((s) => String(s).trim().toUpperCase())
        .filter(Boolean);
      if (sizeList.length) {
        await prisma.productVariant.deleteMany({
          where: {
            productId: existing.id,
            size: { notIn: sizeList },
          },
        });
      }
    }

    if (body.images != null) {
      const urls = cleanImageList(body.images as string[]);
      // DB rows only — files under /uploads stay on disk
      await prisma.productImage.deleteMany({
        where: { productId: existing.id },
      });
      if (urls.length) {
        await prisma.productImage.createMany({
          data: urls.map((url, i) => ({
            productId: existing.id,
            url,
            sortOrder: i,
            alt: String(body.name ?? existing.name),
          })),
        });
      }
    }

    // Add a new color + variants for all existing sizes (stock default 0)
    if (body.addColor && typeof body.addColor === "object") {
      const c = body.addColor as {
        key?: string;
        name?: string;
        nameUk?: string;
        hex?: string;
        stock?: number;
      };
      const key = String(c.key ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "");
      const name = String(c.name ?? "").trim();
      const hex = String(c.hex ?? "#111111").trim();
      if (!key || !name) {
        return jsonError("addColor requires key and name");
      }
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: existing.id },
        include: { colors: true, variants: true },
      });
      if (product.colors.some((x) => x.key === key)) {
        return jsonError("Колір з таким key уже є", 409);
      }
      const sizes = [
        ...new Set(product.variants.map((v) => v.size)),
      ];
      if (!sizes.length) sizes.push("M");
      const sortOrder =
        product.colors.reduce((m, x) => Math.max(m, x.sortOrder), -1) + 1;
      const color = await prisma.productColor.create({
        data: {
          productId: product.id,
          key,
          name,
          nameUk: String(c.nameUk ?? name),
          hex,
          sortOrder,
        },
      });
      const stock = Math.max(0, Number(c.stock) || 0);
      for (const size of sizes) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: color.id,
            size,
            stock,
            sku: buildVariantSku(product.sku || product.slug, key, size),
          },
        });
      }
    }

    // Add a size column for every existing color
    if (body.addSize != null && String(body.addSize).trim()) {
      const size = String(body.addSize).trim().toUpperCase();
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: existing.id },
        include: { colors: true, variants: true },
      });
      const stock = Math.max(0, Number(body.addSizeStock) || 0);
      for (const color of product.colors) {
        const exists = product.variants.some(
          (v) => v.colorId === color.id && v.size === size
        );
        if (exists) continue;
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            colorId: color.id,
            size,
            stock,
            sku: buildVariantSku(product.sku || product.slug, color.key, size),
          },
        });
      }
    }

    if (body.inventory && typeof body.inventory === "object") {
      const product = await prisma.product.findUniqueOrThrow({
        where: { id: existing.id },
        include: { colors: true, variants: true },
      });
      const touchedSizes = new Set<string>();
      for (const [key, qty] of Object.entries(
        body.inventory as Record<string, number>
      )) {
        const [colorKey, size] = key.split(":");
        if (!size) continue;
        touchedSizes.add(size);
        const color = product.colors.find((c) => c.key === colorKey);
        if (!color) continue;
        await prisma.productVariant.upsert({
          where: {
            productId_colorId_size: {
              productId: product.id,
              colorId: color.id,
              size,
            },
          },
          create: {
            productId: product.id,
            colorId: color.id,
            size,
            stock: Math.max(0, Number(qty) || 0),
            sku: buildVariantSku(product.sku || product.slug, colorKey, size),
          },
          update: { stock: Math.max(0, Number(qty) || 0) },
        });
      }
      // Ensure every color has a row for newly touched sizes (stock 0)
      for (const size of touchedSizes) {
        for (const color of product.colors) {
          const exists = product.variants.some(
            (v) => v.colorId === color.id && v.size === size
          );
          if (exists) continue;
          // may already be created above for one color
          const again = await prisma.productVariant.findUnique({
            where: {
              productId_colorId_size: {
                productId: product.id,
                colorId: color.id,
                size,
              },
            },
          });
          if (again) continue;
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              colorId: color.id,
              size,
              stock: 0,
              sku: buildVariantSku(product.sku || product.slug, color.key, size),
            },
          });
        }
      }
    }

    await syncProductVariantSkus(existing.id);

    const full = await prisma.product.findUniqueOrThrow({
      where: { id: existing.id },
      include: productInclude,
    });
    return jsonOk({ ok: true, product: mapProduct(full) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  try {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const permanent = searchParams.get("permanent") === "1";

    const existing = await prisma.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });
    if (!existing) return jsonError("Product not found", 404);

    // Default: soft-delete → trash (still reachable from order history)
    if (!permanent) {
      if (!existing.active) {
        return jsonOk({ ok: true, trashed: true, already: true });
      }
      await prisma.product.update({
        where: { id: existing.id },
        data: { active: false },
      });
      return jsonOk({ ok: true, trashed: true });
    }

    // Permanent only from trash — avoids accidental hard wipe of live catalog
    if (existing.active) {
      return jsonError("Спочатку перемістіть товар у смітник", 400);
    }

    // Archive snapshot, then hard-delete DB row (files on disk kept)
    await archiveProductBeforeDelete(existing.id, admin.email);
    await prisma.product.delete({ where: { id: existing.id } });
    return jsonOk({ ok: true, deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
