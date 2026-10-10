import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const productId = new URL(req.url).searchParams.get("productId");
    const reviews = await prisma.review.findMany({
      where: {
        approved: true,
        ...(productId ? { productId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk({
      ok: true,
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId ?? undefined,
        author: r.author,
        rating: r.rating,
        text: r.text,
        date: r.createdAt.toISOString().slice(0, 10),
        city: r.city,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();
    const text = String(body.text ?? "").trim();
    const rating = Number(body.rating ?? 5);
    const author = String(body.author ?? user?.name ?? "").trim();
    const city = String(body.city ?? "").trim();
    const productId = body.productId ? String(body.productId) : null;

    if (!text || !author || rating < 1 || rating > 5) {
      return jsonError("author, text, rating (1–5) required");
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: user?.id,
        author,
        rating,
        text,
        city,
        approved: true,
      },
    });

    return jsonOk({ ok: true, review }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
