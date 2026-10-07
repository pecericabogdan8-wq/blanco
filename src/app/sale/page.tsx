"use client";

import { useMemo } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { useShopStore } from "@/store/shop-store";

export default function SalePage() {
  const products = useShopStore((s) => s.products);
  const onSale = useMemo(
    () => products.filter((p) => p.salePrice != null && p.salePrice < p.price),
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 max-w-xl">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">Outlet</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Sale</h1>
        <p className="mt-3 text-muted-foreground">
          Обрані позиції зі знижкою — поки є розміри.
        </p>
      </div>
      {onSale.length === 0 ? (
        <p className="text-muted-foreground">Зараз немає акційних товарів.</p>
      ) : (
        <div className="product-grid grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
          {onSale.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
