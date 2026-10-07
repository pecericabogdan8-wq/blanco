"use client";

import Image from "next/image";
import Link from "next/link";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/lib/demo-data";
import { formatUAH } from "@/lib/format";
import { useShopStore } from "@/store/shop-store";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orders = useShopStore((s) => s.orders);
  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Замовлення не знайдено</h1>
        <Button className="mt-6" render={<Link href="/account" />}>До кабінету</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm text-muted-foreground">
        <Link href="/account" className="hover:underline">
          Кабінет
        </Link>{" "}
        / замовлення
      </p>
      <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">{order.id}</h1>
      <p className="mt-2 text-muted-foreground">
        {new Date(order.createdAt).toLocaleString("uk-UA")} ·{" "}
        <span className="font-medium text-foreground">
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </p>

      <div className="mt-8 space-y-4 border border-border p-4">
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.colorId}-${item.size}`}
            className="flex gap-4"
          >
            <div className="relative size-16 overflow-hidden bg-mist">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.colorName} · {item.size} · ×{item.qty}
              </p>
            </div>
            <p>{formatUAH(item.price * item.qty)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Оплата</span>
          <span>
            {order.paymentMethod === "card"
              ? "Картка"
              : order.paymentMethod === "apple_pay"
                ? "Apple Pay"
                : "Google Pay"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Доставка</span>
          <span>
            {order.customer.city}, {order.customer.address}
            {order.customer.novaPoshta ? ` · НП ${order.customer.novaPoshta}` : ""}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
          <span>Разом</span>
          <span>{formatUAH(order.total)}</span>
        </div>
      </div>

      <div className="mt-8 rounded-md border border-dashed border-border bg-mist/50 p-4 text-sm text-muted-foreground">
        Статус «Оплачено» означає, що демо-платіж пройшов і залишки на складі зменшено.
        Далі адмін веде: в обробці → відправлено → доставлено.
      </div>
    </div>
  );
}
