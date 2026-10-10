import { prisma } from "@/lib/db";
import { createSession, hashPassword, toSessionUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`register:${ip}`, {
      limit: 5,
      windowMs: 60 * 60_000,
    });
    if (!limited.ok) {
      return jsonError("Забагато реєстрацій з цієї адреси. Спробуйте пізніше.", 429);
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse({
      name: body.name,
      email: body.email,
      password: body.password,
    });
    if (!parsed.success) {
      return jsonError("Ім’я, email і пароль (мін. 6) обов’язкові");
    }

    const name = parsed.data.name;
    const email = parsed.data.email.toLowerCase();
    const password = parsed.data.password;
    const phone = body.phone ? String(body.phone).trim().slice(0, 32) : null;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return jsonError("Email уже зареєстрований", 409);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash: await hashPassword(password),
        settings: JSON.stringify({ locale: "uk", newsletter: false }),
      },
    });

    await createSession(user.id);
    return jsonOk({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
