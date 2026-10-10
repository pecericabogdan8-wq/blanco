"use client";

import Image from "next/image";
import { Heart, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatUAH, productPrice, totalStock } from "@/lib/format";
import {
  localizedColorName,
  localizedProductName,
} from "@/lib/localize-product";
import { isBestseller, isProductNew } from "@/lib/product-badges";
import { toggleWishlist } from "@/lib/wishlist-actions";
import { useShopStore } from "@/store/shop-store";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  bestsellerIds = [],
}: {
  product: Product;
  bestsellerIds?: string[];
}) {
  const t = useTranslations("Product");
  const tCat = useTranslations("Categories");
  const wished = useShopStore((s) => s.wishlist.includes(product.id));
  const { current, onSale, original } = productPrice(
    product.price,
    product.salePrice
  );
  const stock = totalStock(product.inventory);
  const soldOut = stock === 0;
  const displayName = localizedProductName(product);
  const showNew = isProductNew(product);
  const showBestseller = isBestseller(product.id, bestsellerIds);

  return (
    <article className="group relative">
      <Link
        href={`/product/${product.slug}`}
        className="img-zoom relative block overflow-hidden bg-[#f0eee9]"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            key={product.images[0]}
            src={product.images[0]}
            alt={displayName}
            fill
            quality={95}
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover"
            unoptimized={product.images[0]?.startsWith("/products/")}
          />
          <div className="pointer-events-none absolute top-2 left-2 right-12 z-[1] flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1">
            {onSale && (
              <span className="bg-ink/90 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase backdrop-blur-[1px]">
                {t("sale")}
              </span>
            )}
            {showBestseller && (
              <span className="bg-ink/90 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase backdrop-blur-[1px]">
                {t("bestseller")}
              </span>
            )}
            {showNew && (
              <span className="bg-pine/95 px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase backdrop-blur-[1px]">
                {t("new")}
              </span>
            )}
          </div>
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs tracking-[0.18em] text-white uppercase">
              {t("soldOut")}
            </span>
          )}
          <span className="pointer-events-none absolute right-3 bottom-3 flex size-9 items-center justify-center bg-ink text-mist opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
            <ShoppingBag className="size-4" />
          </span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? t("removeWishlist") : t("addWishlist")}
        className={cn(
          "absolute top-3 right-3 cursor-pointer rounded-full bg-white/95 p-2.5 text-foreground shadow-sm transition duration-150 hover:bg-white active:scale-95",
          wished && "text-destructive"
        )}
        onClick={async () => {
          try {
            const next = await toggleWishlist(product.id);
            toast.success(next ? t("addedWishlist") : t("removedWishlist"));
          } catch {
            toast.error(t("wishlistError"));
          }
        }}
      >
        <Heart className={cn("size-4", wished && "fill-current")} />
      </button>
      <div className="mt-3 space-y-1">
        <Link
          href={`/product/${product.slug}`}
          className="block text-[12px] font-semibold leading-snug tracking-wide uppercase transition-opacity hover:opacity-70 sm:text-[14px]"
        >
          <span className="line-clamp-2">{displayName}</span>
        </Link>
        <div className="flex items-baseline gap-2 pt-0.5 text-sm font-semibold">
          <span className={cn(onSale ? "text-[#c41e3a]" : "text-foreground")}>
            {formatUAH(current)}
          </span>
          {onSale && (
            <span className="font-normal text-muted-foreground line-through">
              {formatUAH(original)}
            </span>
          )}
        </div>
        <p className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
          {tCat(product.category)}
        </p>
        <span className="sr-only">
          {product.colors.map((c) => localizedColorName(c)).join(", ")}
        </span>
      </div>
    </article>
  );
}
