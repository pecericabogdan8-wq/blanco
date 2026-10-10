import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { supportSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`support:${ip}`, {
      limit: 8,
      windowMs: 60 * 60_000,
    });
    if (!limited.ok) {
      return jsonError("Забагато звернень. Спробуйте пізніше.", 429);
    }

    const body = await req.json().catch(() => null);
    const user = await getCurrentUser();
    const parsed = supportSchema.safeParse({
      email: body?.email ?? user?.email ?? "",
      message: body?.message,
    });
    if (!parsed.success) {
      return jsonError("Вкажіть коректний email і повідомлення");
    }

    const email = parsed.data.email.toLowerCase();
    const message = parsed.data.message;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    let telegramSent = false;

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: user?.id,
        email,
        message,
        status: "escalated",
        telegramSent: false,
      },
    });

    if (token && chatId) {
      const text = [
        "🆘 Blanco support ticket",
        `ID: ${ticket.id}`,
        `Email: ${email}`,
        "",
        message,
      ].join("\n");

      try {
        const res = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text }),
          }
        );
        telegramSent = res.ok;
        if (telegramSent) {
          await prisma.supportTicket.update({
            where: { id: ticket.id },
            data: { telegramSent: true },
          });
        }
      } catch {
        telegramSent = false;
      }
    }

    return jsonOk({
      ok: true,
      ticketId: ticket.id,
      telegramSent,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET() {
  try {
    const { requireAdmin } = await import("@/lib/auth");
    await requireAdmin();
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return jsonOk({ ok: true, tickets });
  } catch (err) {
    return handleApiError(err);
  }
}
