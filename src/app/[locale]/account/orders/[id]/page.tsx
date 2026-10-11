"use client";
import { Link } from "@/i18n/navigation";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_STYLE } from "@/lib/demo-data";
import { formatUAH } from "@/lib/format";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const t = useTranslations("Account");
  const tStatus = useTranslations("OrderStatus");
  const tCheckout = useTranslations("Checkout");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setOrder(d.order);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">{t("orderNotFound")}</h1>
        <Button className="mt-6" render={<Link href="/account" />}>
          {t("toAccount")}
        </Button>
      </div>
    );
  }

  const paymentLabel =
    order.paymentMethod === "card"
      ? t("card")
      : order.paymentMethod === "apple_pay"
        ? tCheckout("applePay")
        : tCheckout("googlePay");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm text-muted-foreground">
        <Link href="/account" className="hover:underline">
          {t("title")}
        </Link>{" "}
        / {t("breadcrumbOrder")}
      </p>
      <h1 className="font-display mt-2 text-4xl font-bold tracking-tight">
        {order.id}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
        <span>{new Date(order.createdAt).toLocaleString("uk-UA")}</span>
        {(() => {
          const st =
            ORDER_STATUS_STYLE[order.status] ?? ORDER_STATUS_STYLE.placed;
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                st.chip
              )}
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", st.dot)} />
              {tStatus(order.status as "placed")}
            </span>
          );
        })()}
      </p>

      <div className="mt-8 space-y-4 border border-border p-4">
        {order.items.map((item, idx) => {
          const canLink =
            item.productStatus !== "gone" && Boolean(item.productSlug);
          const inner = (
            <>
              <div className="relative size-16 shrink-0 overflow-hidden bg-mist">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "font-medium",
                    canLink && "underline-offset-2 group-hover:underline"
                  )}
                >
                  {item.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {item.colorName} · {item.size} · ×{item.qty}
                  {item.sku ? (
                    <span className="mt-0.5 block font-mono text-[11px] tracking-wide">
                      {item.sku}
                    </span>
                  ) : null}
                </p>
                {item.productStatus === "trash" && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("productInTrash")}
                  </p>
                )}
                {item.productStatus === "gone" && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {t("productGone")}
                  </p>
                )}
              </div>
              <p className="shrink-0">{formatUAH(item.price * item.qty)}</p>
            </>
          );

          return canLink ? (
            <Link
              key={`${item.productId}-${item.colorId}-${item.size}-${idx}`}
              href={`/product/${item.productSlug}`}
              className="group flex gap-4 transition-opacity hover:opacity-80"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={`${item.productId}-${item.colorId}-${item.size}-${idx}`}
              className="flex gap-4"
            >
              {inner}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("payment")}</span>
          <span>{paymentLabel}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">{t("shipping")}</span>
          <span className="text-right">
            {order.customer.city}, {order.customer.address}
            {order.customer.novaPoshta
              ? ` · ${t("np", { branch: order.customer.novaPoshta })}`
              : ""}
          </span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
          <span>{t("total")}</span>
          <span>{formatUAH(order.total)}</span>
        </div>
      </div>

      <div className="mt-8">
        <Button
          variant="outline"
          className="w-full bg-white sm:w-auto"
          render={
            <Link href={`/returns?order=${encodeURIComponent(order.id)}#zayavka`} />
          }
        >
          {t("returnRequest")}
        </Button>
      </div>
    </div>
  );
}
