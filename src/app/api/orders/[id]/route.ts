import { prisma } from "@/lib/db";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { mapOrder, orderItemInclude } from "@/lib/order-mapper";
import {
  isStockRestoringStatus,
  reserveOrderStock,
  restoreOrderStock,
} from "@/lib/order-stock";
import type { OrderStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED: OrderStatus[] = [
  "placed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
];

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
    const status = body.status as OrderStatus | undefined;
    if (status != null && !ALLOWED.includes(status)) {
      return jsonError("Invalid status");
    }

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return jsonError("Замовлення не знайдено", 404);

    const nextStatus = status ?? existing.status;
    const wasRestoring = isStockRestoringStatus(existing.status);
    const willRestore = isStockRestoringStatus(nextStatus);

    // Cancel / return → put stock back once
    if (willRestore && !wasRestoring) {
      await restoreOrderStock(id);
    }
    // Undo cancel/return → reserve again
    if (!willRestore && wasRestoring) {
      try {
        await reserveOrderStock(id);
      } catch (e) {
        return jsonError(
          e instanceof Error ? e.message : "Не вдалося знову зарезервувати склад",
          409
        );
      }
    }

    const novaPoshtaTtn =
      body.novaPoshtaTtn !== undefined
        ? String(body.novaPoshtaTtn).trim() || null
        : undefined;

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status != null ? { status: nextStatus } : {}),
        ...(novaPoshtaTtn !== undefined ? { novaPoshtaTtn } : {}),
      },
      include: {
        items: { include: orderItemInclude },
        payments: true,
      },
    });

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
        stockRestored: order.stockRestored,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
