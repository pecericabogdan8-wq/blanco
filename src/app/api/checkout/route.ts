import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getCurrentUser, paymentPayloadHash } from "@/lib/auth";
import { calcShipping, getShippingConfig } from "@/lib/shipping";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkoutSchema } from "@/lib/validation";
import type { ProductSize } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    const limited = rateLimit(`checkout:${ip}`, {
      limit: 15,
      windowMs: 60 * 60_000,
    });
    if (!limited.ok) {
      return jsonError("Забагато спроб оформлення. Спробуйте пізніше.", 429);
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Перевірте кошик і контактні дані");
    }

    const method = parsed.data.method;
    const cart = parsed.data.cart.map((line) => ({
      ...line,
      size: line.size as ProductSize,
    }));
    const customer = parsed.data.customer;

    const user = await getCurrentUser();
    const shipCfg = await getShippingConfig();

    const result = await prisma.$transaction(async (tx) => {
      const items: {
        productId: string;
        name: string;
        colorId: string;
        colorName: string;
        size: string;
        qty: number;
        price: number;
        image: string;
        variantId: string;
      }[] = [];

      for (const line of cart) {
        const product = await tx.product.findUnique({
          where: { id: line.productId },
          include: {
            colors: true,
            variants: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
          },
        });
        if (!product || !product.active) {
          throw new Error(`Товар недоступний`);
        }
        const color = product.colors.find((c) => c.key === line.colorId);
        const productLabel = product.nameUk || product.name;
        if (!color) throw new Error(`Колір не знайдено: ${productLabel}`);
        const variant = product.variants.find(
          (v) => v.colorId === color.id && v.size === line.size
        );
        if (!variant || variant.stock < line.qty) {
          throw new Error(
            `Недостатньо «${productLabel}» (${line.size}). У наявності: ${variant?.stock ?? 0}`
          );
        }

        const price = product.salePrice ?? product.price;
        items.push({
          productId: product.id,
          name: productLabel,
          colorId: color.key,
          colorName: color.nameUk || color.name,
          size: line.size,
          qty: line.qty,
          price,
          image: product.images[0]?.url ?? "",
          variantId: variant.id,
        });
      }

      const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
      const shipping = calcShipping(subtotal, shipCfg);
      const total = subtotal + shipping;

      const orderId = `BL-${Date.now().toString(36).toUpperCase()}${randomBytes(2)
        .toString("hex")
        .toUpperCase()}`;

      const order = await tx.order.create({
        data: {
          id: orderId,
          userId: user?.id,
          status: "placed",
          paymentMethod: method,
          subtotal,
          shipping,
          total,
          customerName: customer.name,
          customerEmail: customer.email.toLowerCase(),
          customerPhone: customer.phone,
          city: customer.city,
          address: customer.address,
          novaPoshta: customer.novaPoshta || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              name: i.name,
              colorId: i.colorId,
              colorName: i.colorName,
              size: i.size,
              qty: i.qty,
              price: i.price,
              image: i.image,
            })),
          },
        },
        include: { items: true },
      });

      for (const i of items) {
        const updated = await tx.productVariant.update({
          where: { id: i.variantId },
          data: { stock: { decrement: i.qty } },
        });
        if (updated.stock < 0) {
          throw new Error(`Конфлікт складу для ${i.name}`);
        }
      }

      const externalId = `mock_${orderId}_${Date.now()}`;
      const payloadHash = paymentPayloadHash({
        orderId,
        amount: total,
        method,
        email: customer.email.toLowerCase(),
        externalId,
      });

      // Optional Stripe/LiqPay stubs — always record payment in DB
      const provider = process.env.STRIPE_SECRET_KEY
        ? "stripe-stub"
        : process.env.LIQPAY_PRIVATE_KEY
          ? "liqpay-stub"
          : "mock";

      const payment = await tx.payment.create({
        data: {
          orderId: order.id,
          provider,
          method,
          status: "succeeded",
          amount: total,
          currency: "UAH",
          externalId,
          payloadHash,
          raw: JSON.stringify({
            mode: provider,
            note: "Stub payment — replace with LiqPay webhook in production",
            receivedAt: new Date().toISOString(),
            integrity: createHash("sha256")
              .update(payloadHash)
              .digest("hex")
              .slice(0, 16),
          }),
        },
      });

      const paid = await tx.order.update({
        where: { id: order.id },
        data: { status: "paid" },
        include: { items: true, payments: true },
      });

      return { order: paid, payment };
    });

    return jsonOk({
      ok: true,
      order: {
        id: result.order.id,
        createdAt: result.order.createdAt.toISOString(),
        status: result.order.status,
        paymentMethod: result.order.paymentMethod,
        subtotal: result.order.subtotal,
        shipping: result.order.shipping,
        total: result.order.total,
        customer: {
          name: result.order.customerName,
          email: result.order.customerEmail,
          phone: result.order.customerPhone,
          city: result.order.city,
          address: result.order.address,
          novaPoshta: result.order.novaPoshta ?? undefined,
        },
        userId: result.order.userId ?? undefined,
        items: result.order.items.map((i) => ({
          productId: i.productId ?? "",
          colorId: i.colorId,
          size: i.size,
          qty: i.qty,
          name: i.name,
          price: i.price,
          colorName: i.colorName,
          image: i.image,
        })),
      },
      payment: {
        id: result.payment.id,
        status: result.payment.status,
        provider: result.payment.provider,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      return jsonError(err.message, 400);
    }
    return handleApiError(err);
  }
}
