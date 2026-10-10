import { prisma } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { mapOrder, orderItemInclude } from "@/lib/order-mapper";
import type { OrderStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const user = await getCurrentUser();
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: orderItemInclude },
        payments: true,
      },
    });
    if (!order) return jsonError("Замовлення не знайдено", 404);

    const allowed =
      user?.role === "ADMIN" ||
      (user &&
        (order.userId === user.id || order.customerEmail === user.email));
    if (!allowed) return jsonError("Forbidden", 403);

    return jsonOk({
      ok: true,
      order: {
        ...mapOrder(order),
        payments: order.payments.map((p) => ({
          id: p.id,
          status: p.status,
          provider: p.provider,
          amount: p.amount,
        })),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json();
    const status = body.status as OrderStatus;
    const allowed = [
      "placed",
      "paid",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!allowed.includes(status)) return jsonError("Invalid status");

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return jsonOk({ ok: true, order });
  } catch (err) {
    return handleApiError(err);
  }
}
