"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

export default function SalePage() {
  const t = useTranslations("Sale");
  const storeProducts = useShopStore((s) => s.products);
  const setProducts = useShopStore((s) => s.setProducts);
  const [local, setLocal] = useState<Product[]>([]);
  const products = storeProducts.length > 0 ? storeProducts : local;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return;
        setLocal(d.products);
        setProducts(d.products);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [setProducts]);

  const onSale = useMemo(
    () => products.filter((p) => p.salePrice != null && p.salePrice < p.price),
    [products]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 max-w-xl">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
      </div>
      {onSale.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
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
