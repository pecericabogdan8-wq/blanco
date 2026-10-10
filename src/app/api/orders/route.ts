import { prisma } from "@/lib/db";
import { requireAdmin, requireUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { mapOrder, orderItemInclude } from "@/lib/order-mapper";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";

    if (all) {
      await requireAdmin();
      const orders = await prisma.order.findMany({
        include: {
          items: { include: orderItemInclude },
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return jsonOk({
        ok: true,
        orders: orders.map((o) => ({
          ...mapOrder(o),
          payments: o.payments.map((p) => ({
            id: p.id,
            status: p.status,
            provider: p.provider,
            amount: p.amount,
            createdAt: p.createdAt.toISOString(),
          })),
        })),
      });
    }

    const user = await requireUser();
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ userId: user.id }, { customerEmail: user.email }],
      },
      include: { items: { include: orderItemInclude } },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({ ok: true, orders: orders.map(mapOrder) });
  } catch (err) {
    return handleApiError(err);
  }
}
