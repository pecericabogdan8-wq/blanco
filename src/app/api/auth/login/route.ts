import { prisma } from "@/lib/db";
import { createSession, toSessionUser, verifyPassword } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60_000 });
    if (!limited.ok) {
      return jsonError("Забагато спроб. Спробуйте пізніше.", 429);
    }

    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Невірний email або пароль", 401);
    }

    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError("Невірний email або пароль", 401);
    }

    await createSession(user.id);
    return jsonOk({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
