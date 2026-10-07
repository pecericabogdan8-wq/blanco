"use client";

import Link from "next/link";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { useShopStore } from "@/store/shop-store";

export default function WishlistPage() {
  const products = useShopStore((s) => s.products);
  const wishlist = useShopStore((s) => s.wishlist);
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">Wishlist</h1>
      <p className="mt-2 text-muted-foreground">{items.length} збережених</p>
      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">Поки порожньо — додайте серця на картках товарів</p>
          <Button className="mt-6" render={<Link href="/catalog" />}>До каталогу</Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
