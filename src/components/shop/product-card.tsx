"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/lib/types";
import { formatUAH, productPrice, totalStock } from "@/lib/format";
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const wishlist = useShopStore((s) => s.wishlist);
  const wished = wishlist.includes(product.id);
  const { current, onSale, original } = productPrice(product.price, product.salePrice);
  const stock = totalStock(product.inventory);
  const soldOut = stock === 0;

  return (
    <article className="group relative">
      <Link href={`/product/${product.slug}`} className="img-zoom block overflow-hidden bg-mist">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover"
            priority={product.featured}
          />
          {onSale && (
            <span className="absolute top-3 left-3 bg-primary px-2 py-0.5 text-[10px] tracking-wider text-primary-foreground uppercase">
              Sale
            </span>
          )}
          {product.newArrival && !onSale && (
            <span className="absolute top-3 left-3 bg-pine px-2 py-0.5 text-[10px] tracking-wider text-mist uppercase">
              New
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm tracking-wider text-white uppercase">
              Немає в наявності
            </span>
          )}
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "Прибрати з wishlist" : "Додати в wishlist"}
        className={cn(
          "absolute top-3 right-3 rounded-full bg-mist/90 p-2 transition-colors",
          wished && "text-destructive"
        )}
        onClick={() => {
          toggleWishlist(product.id);
          toast.success(wished ? "Прибрано з wishlist" : "Додано в wishlist");
        }}
      >
        <Heart className={cn("size-4", wished && "fill-current")} />
      </button>
      <div className="mt-3 space-y-1">
        <p className="text-[11px] tracking-[0.15em] text-muted-foreground uppercase">
          {CATEGORY_LABELS[product.category]}
        </p>
        <Link href={`/product/${product.slug}`} className="block font-medium hover:underline">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 text-sm">
          <span>{formatUAH(current)}</span>
          {onSale && (
            <span className="text-muted-foreground line-through">{formatUAH(original)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
