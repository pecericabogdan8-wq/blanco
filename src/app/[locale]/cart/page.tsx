"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { HydratedGate } from "@/components/shop/hydrated-gate";
import { formatUAH } from "@/lib/format";
import {
  localizedColorName,
  localizedProductName,
} from "@/lib/localize-product";
import { Link } from "@/i18n/navigation";
import { useShopStore } from "@/store/shop-store";

function CartInner() {
  const t = useTranslations("Cart");
  const products = useShopStore((s) => s.products);
  const cart = useShopStore((s) => s.cart);
  const updateCartQty = useShopStore((s) => s.updateCartQty);
  const removeFromCart = useShopStore((s) => s.removeFromCart);

  const lines = cart.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return [];
    const color = product.colors.find((c) => c.id === item.colorId);
    const price = product.salePrice ?? product.price;
    return [{ item, product, color, price }];
  });

  const subtotal = lines.reduce((s, l) => s + l.price * l.item.qty, 0);
  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 99;

  if (cart.length === 0 || lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-4xl font-medium tracking-tight">{t("empty")}</h1>
        <p className="mt-2 text-muted-foreground">{t("emptyHint")}</p>
        <Button className="mt-8" render={<Link href="/catalog" />}>
          {t("toCatalog")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-4xl font-medium tracking-tight">{t("title")}</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border">
          {lines.map(({ item, product, color, price }) => {
            const title = localizedProductName(product);
            return (
              <li
                key={`${item.productId}-${item.colorId}-${item.size}`}
                className="flex gap-4 py-6"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="relative size-24 shrink-0 overflow-hidden bg-mist sm:size-28"
                >
                  <Image
                    src={product.images[0]}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {title}
                      </Link>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {color
                          ? localizedColorName(color)
                          : item.colorId}{" "}
                        · {item.size}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">
                      {formatUAH(price * item.qty)}
                    </p>
                  </div>
                  <div className="mt-auto flex items-center gap-3 pt-3">
                    <div className="flex items-center border border-border">
                      <button
                        type="button"
                        className="p-2"
                        aria-label={t("less")}
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.colorId,
                            item.size,
                            item.qty - 1
                          )
                        }
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-8 text-center text-sm">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        className="p-2"
                        aria-label={t("more")}
                        onClick={() =>
                          updateCartQty(
                            item.productId,
                            item.colorId,
                            item.size,
                            item.qty + 1
                          )
                        }
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t("remove")}
                      onClick={() =>
                        removeFromCart(
                          item.productId,
                          item.colorId,
                          item.size
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit border border-border bg-mist/60 p-6">
          <h2 className="text-xl font-semibold">{t("summary")}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("subtotal")}</span>
              <span>{formatUAH(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span>
                {shipping === 0 ? t("freeShipping") : formatUAH(shipping)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("freeFrom", { amount: formatUAH(2500) })}
            </p>
            <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
              <span>{t("total")}</span>
              <span>{formatUAH(subtotal + shipping)}</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full"
            size="lg"
            render={<Link href="/checkout" />}
          >
            {t("checkout")}
          </Button>
        </aside>
      </div>
    </div>
  );
}

export default function CartPage() {
  const t = useTranslations("Cart");
  return (
    <HydratedGate
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
          {t("loading")}
        </div>
      }
    >
      <CartInner />
    </HydratedGate>
  );
}
