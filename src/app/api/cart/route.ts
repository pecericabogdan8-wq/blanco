import { prisma } from "@/lib/db";
import { parseSettings, requireUser } from "@/lib/auth";
import { handleApiError, jsonOk } from "@/lib/api";
import type { CartItem } from "@/lib/types";

function normalizeCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is CartItem =>
        !!x &&
        typeof x === "object" &&
        typeof (x as CartItem).productId === "string" &&
        typeof (x as CartItem).colorId === "string" &&
        typeof (x as CartItem).size === "string" &&
        typeof (x as CartItem).qty === "number"
    )
    .map((x) => ({
      productId: x.productId,
      colorId: x.colorId,
      size: x.size,
      qty: Math.max(1, Math.min(99, Math.floor(x.qty) || 1)),
    }));
}

/** Merge guest + server cart (sum qty per variant). */
export function mergeCarts(a: CartItem[], b: CartItem[]): CartItem[] {
  const map = new Map<string, CartItem>();
  for (const item of [...a, ...b]) {
    const key = `${item.productId}:${item.colorId}:${item.size}`;
    const prev = map.get(key);
    if (prev) {
      map.set(key, { ...prev, qty: Math.min(99, prev.qty + item.qty) });
    } else {
      map.set(key, { ...item });
    }
  }
  return [...map.values()];
}

async function readUserCart(userId: string): Promise<CartItem[]> {
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { settings: true },
  });
  return normalizeCart(parseSettings(row.settings).cart);
}

async function writeUserCart(userId: string, cart: CartItem[]) {
  const row = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { settings: true },
  });
  const settings = parseSettings(row.settings);
  settings.cart = cart;
  await prisma.user.update({
    where: { id: userId },
    data: { settings: JSON.stringify(settings) },
  });
}

export async function GET() {
  try {
    const user = await requireUser();
    const cart = await readUserCart(user.id);
    return jsonOk({ ok: true, cart });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const cart = normalizeCart(body.cart);
    await writeUserCart(user.id, cart);
    return jsonOk({ ok: true, cart });
  } catch (err) {
    return handleApiError(err);
  }
}

/** Login merge: combine guest local cart with server cart. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const guest = normalizeCart(body.cart);
    const server = await readUserCart(user.id);
    const mode = body.mode === "replace" ? "replace" : "merge";
    const cart = mode === "replace" ? guest : mergeCarts(server, guest);
    await writeUserCart(user.id, cart);
    return jsonOk({ ok: true, cart });
  } catch (err) {
    return handleApiError(err);
  }
}
