import { prisma } from "@/lib/db";
import { handleApiError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const mentions = await prisma.instagramMention.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    });
    return jsonOk({
      ok: true,
      mentions: mentions.map((m) => ({
        id: m.id,
        handle: m.handle,
        caption: m.caption,
        image: m.image,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
