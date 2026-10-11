import { prisma } from "@/lib/db";
import { mapProduct, productInclude } from "@/lib/product-mapper";
import { handleApiError, jsonOk } from "@/lib/api";

/** Units sold from non-cancelled orders only. No featured / demo fallbacks. */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 24);

    const items = await prisma.orderItem.findMany({
      where: {
        order: { status: { notIn: ["cancelled", "returned"] } },
      },
      select: { productId: true, qty: true },
    });

    const sold = new Map<string, number>();
    for (const row of items) {
      if (!row.productId) continue;
      sold.set(row.productId, (sold.get(row.productId) ?? 0) + row.qty);
    }

    const ranked = [...sold.entries()]
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1]);
    const salesTopIds = ranked.slice(0, limit).map(([id]) => id);

    if (salesTopIds.length === 0) {
      return jsonOk({
        ok: true,
        products: [],
        salesTopIds: [],
        fromSales: false,
      });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: salesTopIds }, active: true },
      include: productInclude,
    });

    const orderIndex = new Map(salesTopIds.map((id, i) => [id, i]));
    products.sort(
      (a, b) => (orderIndex.get(a.id) ?? 99) - (orderIndex.get(b.id) ?? 99)
    );

    const mapped = products.map((p) => ({
      ...mapProduct(p),
      soldQty: sold.get(p.id) ?? 0,
    }));

    return jsonOk({
      ok: true,
      products: mapped,
      salesTopIds,
      fromSales: true,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
