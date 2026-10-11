import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { mapReturnRequest } from "@/lib/return-mapper";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { returnRequestSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`returns:${ip}`, {
      limit: 10,
      windowMs: 60 * 60_000,
    });
    if (!limited.ok) {
      return jsonError("Забагато заявок. Спробуйте пізніше.", 429);
    }

    const body = await req.json().catch(() => null);
    const parsed = returnRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Перевірте поля форми");
    }

    const user = await getCurrentUser();
    const email = parsed.data.email.toLowerCase();
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
    });
    if (!order) return jsonError("Замовлення не знайдено", 404);

    const emailMatch =
      order.customerEmail.toLowerCase() === email;
    const ownsOrder = user != null && order.userId === user.id;
    if (!emailMatch && !ownsOrder) {
      return jsonError("Email не збігається з замовленням", 403);
    }

    const created = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        userId: user?.id,
        email,
        phone: parsed.data.phone?.trim() || null,
        reason: parsed.data.reason,
        message: parsed.data.message,
        refundWanted: parsed.data.refundWanted ?? true,
        status: "requested",
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
      returnRequest: mapReturnRequest(created),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return jsonError("Unauthorized", 401);

    const isAdmin = user.role === "ADMIN";
    const rows = await prisma.returnRequest.findMany({
      where: isAdmin ? undefined : { userId: user.id },
      orderBy: { createdAt: "desc" },
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
      returns: rows.map(mapReturnRequest),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
