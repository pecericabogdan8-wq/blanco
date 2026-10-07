"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useMemo, useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CATEGORY_LABELS, DEMO_REVIEWS } from "@/lib/demo-data";
import { formatUAH, productPrice, stockFor } from "@/lib/format";
import type { ProductSize } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const products = useShopStore((s) => s.products);
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const wished = useShopStore((s) => s.wishlist.includes(
    s.products.find((p) => p.slug === slug)?.id ?? ""
  ));

  const product = products.find((p) => p.slug === slug);
  const [colorId, setColorId] = useState(product?.colors[0]?.id ?? "");
  const [size, setSize] = useState<ProductSize | "">(product?.sizes[0] ?? "");
  const [imgIdx, setImgIdx] = useState(0);

  const activeColor = product?.colors.find((c) => c.id === colorId) ?? product?.colors[0];
  const activeSize = (size || product?.sizes[0]) as ProductSize | undefined;

  const stock = useMemo(() => {
    if (!product || !activeColor || !activeSize) return 0;
    return stockFor(product.inventory, activeColor.id, activeSize);
  }, [product, activeColor, activeSize]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Товар не знайдено</h1>
        <Button className="mt-6" render={<Link href="/catalog" />}>До каталогу</Button>
      </div>
    );
  }

  const { current, onSale, original } = productPrice(product.price, product.salePrice);
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const reviews = DEMO_REVIEWS.filter((r) => r.productId === product.id);

  function handleAdd() {
    if (!activeColor || !activeSize) {
      toast.error("Оберіть колір і розмір");
      return;
    }
    const res = addToCart({
      productId: product!.id,
      colorId: activeColor.id,
      size: activeSize,
      qty: 1,
    });
    if (res.ok) toast.success("Додано в кошик");
    else toast.error(res.error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/catalog" className="hover:text-foreground">
          Каталог
        </Link>
        <span className="mx-2">/</span>
        <span>{CATEGORY_LABELS[product.category]}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/5] overflow-hidden bg-mist">
            <Image
              src={product.images[imgIdx] ?? product.images[0]}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImgIdx(i)}
                  className={cn(
                    "relative size-20 overflow-hidden border-2",
                    i === imgIdx ? "border-ink" : "border-transparent"
                  )}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
            {product.figure ?? CATEGORY_LABELS[product.category]}
          </p>
          <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl">{formatUAH(current)}</span>
            {onSale && (
              <span className="text-muted-foreground line-through">{formatUAH(original)}</span>
            )}
          </div>
          <p className="mt-5 leading-relaxed text-muted-foreground">{product.description}</p>

          <div className="mt-8">
            <p className="mb-2 text-sm font-medium">
              Колір: <span className="text-muted-foreground">{activeColor?.name}</span>
            </p>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => setColorId(c.id)}
                  className={cn(
                    "size-9 rounded-full border-2",
                    (colorId || product.colors[0].id) === c.id
                      ? "border-ink"
                      : "border-transparent ring-1 ring-border"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Розмір</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const sStock = activeColor
                  ? stockFor(product.inventory, activeColor.id, s)
                  : 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={sStock === 0}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-12 border px-3 py-2 text-sm disabled:opacity-30",
                      (size || product.sizes[0]) === s
                        ? "border-ink bg-ink text-mist"
                        : "border-border"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {stock > 0 ? `У наявності: ${stock} шт.` : "Немає в цьому розмірі"}
            </p>
          </div>

          <div className="sticky bottom-4 z-20 mt-8 flex flex-wrap gap-3 rounded-lg border border-border/80 bg-white/95 p-3 shadow-sm backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none">
            <Button size="lg" onClick={handleAdd} disabled={stock === 0} className="min-w-48 flex-1 sm:flex-none">
              <ShoppingBag className="size-4" />В кошик
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white"
              onClick={() => {
                toggleWishlist(product.id);
                toast.success(wished ? "Прибрано з wishlist" : "У wishlist");
              }}
            >
              <Heart className={cn("size-4", wished && "fill-current text-destructive")} />
              Wishlist
            </Button>
          </div>

          <Accordion className="mt-10">
            <AccordionItem value="details">
              <AccordionTrigger>Деталі</AccordionTrigger>
              <AccordionContent>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {product.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
            {product.sizeChart && (
              <AccordionItem value="size">
                <AccordionTrigger>Таблиця розмірів (см)</AccordionTrigger>
                <AccordionContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2">Розмір</th>
                        <th>Груди</th>
                        <th>Довжина</th>
                        <th>Рукав</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeChart.map((row) => (
                        <tr key={row.size} className="border-b border-border/50">
                          <td className="py-2 font-medium">{row.size}</td>
                          <td>{row.chest}</td>
                          <td>{row.length}</td>
                          <td>{row.sleeve}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </AccordionContent>
              </AccordionItem>
            )}
            {reviews.length > 0 && (
              <AccordionItem value="reviews">
                <AccordionTrigger>Відгуки ({reviews.length})</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="text-sm">
                      <p className="font-medium">
                        {r.author} · {"★".repeat(r.rating)}
                      </p>
                      <p className="mt-1 text-muted-foreground">{r.text}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-display mb-8 text-2xl font-bold">Схожі речі</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
