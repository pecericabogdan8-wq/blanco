import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { mapProduct, productInclude } from "@/lib/product-mapper";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const items = await prisma.wishlistItem.findMany({
      where: { userId: user.id },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      ok: true,
      productIds: items.map((i) => i.productId),
      products: items.filter((i) => i.product.active).map((i) => mapProduct(i.product)),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const { productId } = await req.json();
    if (!productId) return jsonError("productId required");

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: user.id, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      return jsonOk({ ok: true, wished: false });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { active: true },
    });
    if (!product?.active) {
      return jsonError("Товар знято з продажу — в обране додати неможна", 400);
    }

    await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
    return jsonOk({ ok: true, wished: true });
  } catch (err) {
    return handleApiError(err);
  }
}
