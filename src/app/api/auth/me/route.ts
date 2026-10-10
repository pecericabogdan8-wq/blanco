import { getCurrentUser, requireUser, toSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return jsonOk({ ok: true, user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireUser();
    const body = await req.json();
    const data: { name?: string; phone?: string | null; settings?: string } = {};

    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null;
    if (body.settings && typeof body.settings === "object") {
      const current = await prisma.user.findUniqueOrThrow({ where: { id: session.id } });
      const merged = {
        ...JSON.parse(current.settings || "{}"),
        ...body.settings,
      };
      data.settings = JSON.stringify(merged);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
    });
    return jsonOk({ ok: true, user: toSessionUser(user) });
  } catch (err) {
    return handleApiError(err);
  }
}
