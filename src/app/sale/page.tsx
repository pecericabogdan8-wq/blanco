"use client";

import { ProductCard } from "@/components/shop/product-card";
import { useShopStore } from "@/store/shop-store";

export default function SalePage() {
  const products = useShopStore((s) =>
    s.products.filter((p) => p.salePrice != null && p.salePrice < p.price)
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 max-w-xl">
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">Sale</h1>
        <p className="mt-3 text-muted-foreground">
          Обрані позиції зі знижкою — поки є розміри.
        </p>
      </div>
      {products.length === 0 ? (
        <p className="text-muted-foreground">Зараз немає акційних товарів.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
