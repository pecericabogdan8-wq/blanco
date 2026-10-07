"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatUAH } from "@/lib/format";
import { useShopStore } from "@/store/shop-store";

export default function CartPage() {
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

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-4xl font-bold">Кошик порожній</h1>
        <p className="mt-2 text-muted-foreground">Додайте светр — і історія поїде з вами</p>
        <Button className="mt-8" render={<Link href="/catalog" />}>До каталогу</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">Кошик</h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-border">
          {lines.map(({ item, product, color, price }) => (
            <li key={`${item.productId}-${item.colorId}-${item.size}`} className="flex gap-4 py-6">
              <Link
                href={`/product/${product.slug}`}
                className="relative size-24 shrink-0 overflow-hidden bg-mist sm:size-28"
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2">
                  <div>
                    <Link href={`/product/${product.slug}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {color?.name} · {item.size}
                    </p>
                  </div>
                  <p className="font-medium">{formatUAH(price * item.qty)}</p>
                </div>
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <div className="flex items-center border border-border">
                    <button
                      type="button"
                      className="p-2"
                      aria-label="Менше"
                      onClick={() =>
                        updateCartQty(item.productId, item.colorId, item.size, item.qty - 1)
                      }
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      className="p-2"
                      aria-label="Більше"
                      onClick={() =>
                        updateCartQty(item.productId, item.colorId, item.size, item.qty + 1)
                      }
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Видалити"
                    onClick={() => removeFromCart(item.productId, item.colorId, item.size)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit border border-border bg-mist/60 p-6">
          <h2 className="font-display text-xl font-semibold">Підсумок</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Товари</span>
              <span>{formatUAH(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>{shipping === 0 ? "Безкоштовно" : formatUAH(shipping)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Безкоштовна доставка від 2500 ₴</p>
            <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
              <span>Разом</span>
              <span>{formatUAH(subtotal + shipping)}</span>
            </div>
          </div>
          <Button className="mt-6 w-full" size="lg" render={<Link href="/checkout" />}>Оформити</Button>
        </aside>
      </div>
    </div>
  );
}
