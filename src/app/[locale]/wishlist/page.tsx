"use client";

import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { HydratedGate } from "@/components/shop/hydrated-gate";
import { Link } from "@/i18n/navigation";
import { useShopStore } from "@/store/shop-store";

function WishlistInner() {
  const t = useTranslations("Wishlist");
  const products = useShopStore((s) => s.products);
  const wishlist = useShopStore((s) => s.wishlist);
  const items = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("saved", { count: items.length })}
      </p>
      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">{t("empty")}</p>
          <Button className="mt-6" render={<Link href="/catalog" />}>
            {t("toCatalog")}
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  const t = useTranslations("Catalog");
  return (
    <HydratedGate
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
          {t("loading")}
        </div>
      }
    >
      <WishlistInner />
    </HydratedGate>
  );
}
