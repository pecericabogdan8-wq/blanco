import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import { getShippingConfig } from "@/lib/shipping";

export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany();
    const settings: Record<string, unknown> = {};
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = row.value;
      }
    }
    if (!settings.shipping) settings.shipping = await getShippingConfig();
    return jsonOk({ ok: true, settings });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const entries = Object.entries(body.settings ?? body);
    for (const [key, value] of entries) {
      await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: JSON.stringify(value) },
        update: { value: JSON.stringify(value) },
      });
    }
    return jsonOk({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
