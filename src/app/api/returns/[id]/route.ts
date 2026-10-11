import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { mapReturnRequest } from "@/lib/return-mapper";
import { restoreOrderStock } from "@/lib/order-stock";
import type { ReturnRequestStatus } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

const ALLOWED: ReturnRequestStatus[] = [
  "requested",
  "approved",
  "rejected",
  "awaiting_parcel",
  "received",
  "sent_back",
  "refunded",
  "exchanged",
  "closed",
];

const STOCK_TRIGGER: ReturnRequestStatus[] = [
  "received",
  "refunded",
  "exchanged",
];

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          include: { payments: true },
        },
      },
    });
    if (!existing) return jsonError("Заявку не знайдено", 404);

    const status = body.status as ReturnRequestStatus | undefined;
    if (status != null && !ALLOWED.includes(status)) {
      return jsonError("Invalid status");
    }

    const nextStatus = status ?? existing.status;
    const bodyRestoreStock = body.restoreStock === true;
    const shouldTryRestore =
      !existing.restoreStock &&
      (bodyRestoreStock || STOCK_TRIGGER.includes(nextStatus));

    if (shouldTryRestore) {
      await restoreOrderStock(existing.orderId);
    }

    if (nextStatus === "refunded") {
      // Stub: live refund requires LiqPay API credentials — no outbound call here.
      const payment = existing.order.payments.find(
        (p) => p.status === "succeeded"
      );
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "refunded" },
        });
      }
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data: {
        ...(status != null ? { status } : {}),
        ...(body.adminNote !== undefined
          ? { adminNote: String(body.adminNote).trim() || null }
          : {}),
        ...(shouldTryRestore ? { restoreStock: true } : {}),
      },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            total: true,
            customerName: true,
            customerEmail: true,
            createdAt: true,
          },
        },
      },
    });

    return jsonOk({
      ok: true,
      returnRequest: mapReturnRequest(updated),
      stockRestored: shouldTryRestore,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
