import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const rows = await prisma.stockWriteoff.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
    });
    return jsonOk({
      ok: true,
      writeoffs: rows.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.productName,
        productSku: r.productSku,
        variantSku: r.variantSku,
        colorKey: r.colorKey,
        colorName: r.colorName,
        size: r.size,
        qty: r.qty,
        note: r.note,
        createdBy: r.createdBy,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = await req.json();
    const productId =
      body.productId != null ? String(body.productId) : null;
    const productName = String(body.productName ?? "").trim();
    const colorKey = String(body.colorKey ?? "").trim();
    const size = String(body.size ?? "").trim().toUpperCase();
    const qty = Math.max(1, Number(body.qty) || 1);
    const note =
      body.note != null && String(body.note).trim()
        ? String(body.note).trim()
        : null;

    if (!productName || !colorKey || !size) {
      return jsonError("Потрібні товар, колір і розмір");
    }

    const row = await prisma.stockWriteoff.create({
      data: {
        productId,
        productName,
        productSku:
          body.productSku != null ? String(body.productSku) : null,
        variantSku:
          body.variantSku != null ? String(body.variantSku) : null,
        colorKey,
        colorName: String(body.colorName ?? ""),
        size,
        qty,
        note,
        createdBy: admin.email ?? null,
      },
    });

    return jsonOk(
      {
        ok: true,
        writeoff: {
          id: row.id,
          productId: row.productId,
          productName: row.productName,
          productSku: row.productSku,
          variantSku: row.variantSku,
          colorKey: row.colorKey,
          colorName: row.colorName,
          size: row.size,
          qty: row.qty,
          note: row.note,
          createdBy: row.createdBy,
          createdAt: row.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
