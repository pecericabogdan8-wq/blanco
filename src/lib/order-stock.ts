import { prisma } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

/** Statuses that mean units are back (or never left) the warehouse. */
export function isStockRestoringStatus(status: OrderStatus): boolean {
  return status === "cancelled" || status === "returned";
}

/**
 * Put order line quantities back onto ProductVariant stock.
 * Matches OrderItem.colorId (color key) + size to variants.
 */
export async function restoreOrderStock(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  if (order.stockRestored) return { restored: false, reason: "already" as const };

  for (const item of order.items) {
    if (!item.productId) continue;
    const color = await prisma.productColor.findFirst({
      where: { productId: item.productId, key: item.colorId },
    });
    if (!color) continue;
    await prisma.productVariant.updateMany({
      where: {
        productId: item.productId,
        colorId: color.id,
        size: item.size,
      },
      data: { stock: { increment: item.qty } },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { stockRestored: true },
  });
  return { restored: true as const };
}

/**
 * Re-reserve stock when an order leaves cancelled/returned (rare admin undo).
 */
export async function reserveOrderStock(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order.stockRestored) return { reserved: false, reason: "not_restored" as const };

  for (const item of order.items) {
    if (!item.productId) continue;
    const color = await prisma.productColor.findFirst({
      where: { productId: item.productId, key: item.colorId },
    });
    if (!color) {
      throw new Error(`Колір «${item.colorName}» не знайдено для ${item.name}`);
    }
    const variant = await prisma.productVariant.findFirst({
      where: {
        productId: item.productId,
        colorId: color.id,
        size: item.size,
      },
    });
    if (!variant || variant.stock < item.qty) {
      throw new Error(
        `Недостатньо «${item.name}» (${item.colorName} ${item.size}) щоб знову зарезервувати`
      );
    }
    await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: { decrement: item.qty } },
    });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { stockRestored: false },
  });
  return { reserved: true as const };
}
