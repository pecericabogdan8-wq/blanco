import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.message) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  let telegramSent = false;

  if (token && chatId) {
    const text = [
      "🆘 Blanco support ticket",
      `ID: ${body.ticketId ?? "—"}`,
      `Email: ${body.email ?? "—"}`,
      "",
      body.message,
    ].join("\n");

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      telegramSent = res.ok;
    } catch {
      telegramSent = false;
    }
  }

  return NextResponse.json({
    ok: true,
    telegramSent,
    mock: !token || !chatId,
  });
}
