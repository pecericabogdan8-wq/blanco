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
  const wished = useShopStore((s) => s.wishlist.includes(product.id));
  const { current, onSale, original } = productPrice(product.price, product.salePrice);
  const stock = totalStock(product.inventory);
  const soldOut = stock === 0;

  return (
    <article className="group relative">
      <Link
        href={`/product/${product.slug}`}
        className="img-zoom relative block overflow-hidden bg-[#ececea]"
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width:768px) 50vw, 25vw"
            className="object-cover"
            priority={product.featured}
          />
          {onSale && (
            <span className="absolute top-3 left-3 bg-ink px-2 py-1 text-[10px] tracking-[0.14em] text-mist uppercase">
              Sale
            </span>
          )}
          {product.newArrival && !onSale && (
            <span className="absolute top-3 left-3 bg-pine px-2 py-1 text-[10px] tracking-[0.14em] text-mist uppercase">
              New
            </span>
          )}
          {soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-xs tracking-[0.18em] text-white uppercase">
              Немає в наявності
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-black/45 to-transparent p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-[11px] tracking-[0.16em] text-white uppercase">
            Дивитись товар
          </span>
        </div>
      </Link>
      <button
        type="button"
        aria-label={wished ? "Прибрати з wishlist" : "Додати в wishlist"}
        className={cn(
          "absolute top-3 right-3 rounded-full bg-white/95 p-2.5 text-foreground shadow-sm transition duration-150 hover:bg-white active:scale-95",
          wished && "text-destructive"
        )}
        onClick={() => {
          toggleWishlist(product.id);
          toast.success(wished ? "Прибрано з wishlist" : "Додано в wishlist");
        }}
      >
        <Heart className={cn("size-4", wished && "fill-current")} />
      </button>
      <div className="mt-3.5 space-y-1">
        <p className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          {CATEGORY_LABELS[product.category]}
        </p>
        <Link
          href={`/product/${product.slug}`}
          className="block text-[15px] font-medium tracking-tight transition-opacity hover:opacity-70"
        >
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 pt-0.5 text-sm">
          <span className={cn(onSale && "text-destructive")}>{formatUAH(current)}</span>
          {onSale && (
            <span className="text-muted-foreground line-through">{formatUAH(original)}</span>
          )}
        </div>
      </div>
    </article>
  );
}
