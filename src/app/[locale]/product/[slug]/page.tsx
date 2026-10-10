"use client";
import { Link } from "@/i18n/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ProductCard } from "@/components/shop/product-card";
import { ProductGallery } from "@/components/shop/product-gallery";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { formatUAH, productPrice, stockFor, totalStock } from "@/lib/format";
import {
  localizedColorName,
  localizedFigure,
  localizedProductDescription,
  localizedProductDetails,
  localizedProductName,
} from "@/lib/localize-product";
import { relatedProducts } from "@/lib/related-products";
import type { Product, ProductSize } from "@/lib/types";
import { toggleWishlist } from "@/lib/wishlist-actions";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

function firstAvailableSize(product: Product, colorKey: string): ProductSize | "" {
  for (const s of product.sizes) {
    if (stockFor(product.inventory, colorKey, s) > 0) return s;
  }
  return product.sizes[0] ?? "";
}

export default function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const t = useTranslations("Product");
  const tNav = useTranslations("Nav");
  const tCat = useTranslations("Categories");
  const storeProducts = useShopStore((s) => s.products);
  const setProducts = useShopStore((s) => s.setProducts);
  const addToCart = useShopStore((s) => s.addToCart);

  const [product, setProduct] = useState<Product | null>(
    () => storeProducts.find((p) => p.slug === slug) ?? null
  );
  const [colorId, setColorId] = useState(product?.colors[0]?.id ?? "");
  const [size, setSize] = useState<ProductSize | "">(
    product ? firstAvailableSize(product, product.colors[0]?.id ?? "") : ""
  );
  const [loading, setLoading] = useState(!product);

  const wished = useShopStore((s) =>
    s.wishlist.includes(product?.id ?? "")
  );

  async function refreshProduct() {
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();
    if (!data.ok) {
      setProduct(null);
      setLoading(false);
      return;
    }
    const p = data.product as Product;
    setProduct(p);
    setProducts([
      ...storeProducts.filter((x) => x.id !== p.id),
      p,
    ]);
    setLoading(false);
    return p;
  }

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        if (cancelled || !data.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const p = data.product as Product;
        setProduct(p);
        const c0 = p.colors[0]?.id ?? "";
        setColorId((prev) => prev || c0);
        setSize((prev) => prev || firstAvailableSize(p, c0));
        useShopStore.setState((s) => ({
          products: s.products.some((x) => x.id === p.id)
            ? s.products.map((x) => (x.id === p.id ? p : x))
            : [...s.products, p],
          productsLoaded: true,
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    const onFocus = () => void refreshProduct();
    window.addEventListener("focus", onFocus);
    const t = window.setInterval(() => void refreshProduct(), 20000);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const activeColor =
    product?.colors.find((c) => c.id === colorId) ?? product?.colors[0];
  const activeSize = (size || product?.sizes[0]) as ProductSize | undefined;

  const stock = useMemo(() => {
    if (!product || !activeColor || !activeSize) return 0;
    return stockFor(product.inventory, activeColor.id, activeSize);
  }, [product, activeColor, activeSize]);

  function selectColor(id: string) {
    if (!product) return;
    setColorId(id);
    setSize(firstAvailableSize(product, id));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        {t("loading")}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="text-3xl font-medium tracking-tight">{t("notFound")}</h1>
        <Button className="mt-6" render={<Link href="/catalog" />}>
          {t("toCatalog")}
        </Button>
      </div>
    );
  }

  const { current, onSale, original } = productPrice(
    product.price,
    product.salePrice
  );
  const discontinued = product.active === false;
  const anyStock = totalStock(product.inventory) > 0;
  const purchaseBlocked = discontinued || !anyStock || stock <= 0;
  const related = discontinued
    ? []
    : relatedProducts(product, storeProducts, 4);

  const colorHasAnyStock = (colorKey: string) =>
    !discontinued &&
    product.sizes.some((s) => stockFor(product.inventory, colorKey, s) > 0);

  function handleAdd() {
    if (!product || !activeColor || !activeSize) {
      toast.error(t("pickColorSize"));
      return;
    }
    if (discontinued) {
      toast.error(t("discontinued"));
      return;
    }
    if (stock <= 0) {
      toast.error(t("variantUnavailable"));
      return;
    }
    const res = addToCart({
      productId: product.id,
      colorId: activeColor.id,
      size: activeSize,
      qty: 1,
    });
    if (res.ok) toast.success(t("addedToCart"));
    else toast.error(res.error);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      <Link
        href="/catalog"
        className="mb-6 inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-foreground/70 uppercase transition-opacity hover:opacity-60"
      >
        <ArrowLeft className="size-3.5" />
        {t("backToCatalog")}
      </Link>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:items-start md:gap-8 lg:gap-10 xl:gap-14">
        <div className="w-full min-w-0">
          <ProductGallery
            images={product.images}
            alt={localizedProductName(product)}
          />
        </div>

        <div>
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
            {localizedFigure(product) ?? tCat(product.category)}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight uppercase sm:text-3xl">
            {localizedProductName(product)}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {tCat(product.category)}
          </p>

          {discontinued && (
            <div className="mt-5 border border-border bg-[#f3f2ef] px-4 py-3">
              <p className="text-sm font-medium">{t("discontinued")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("discontinuedHint")}
              </p>
            </div>
          )}
          {!discontinued && !anyStock && (
            <div className="mt-5 border border-border bg-[#f3f2ef] px-4 py-3">
              <p className="text-sm font-medium">{t("allSoldOut")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("allSoldOutHint")}
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-baseline gap-2">
            <p
              className={cn(
                "text-2xl font-semibold tracking-tight sm:text-[1.75rem]",
                onSale && "text-[#c41e3a]"
              )}
            >
              {formatUAH(current)}
            </p>
            {onSale && (
              <p className="text-sm text-muted-foreground line-through">
                {formatUAH(original)}
              </p>
            )}
          </div>

          <div className="mt-6">
            <Accordion defaultValue={["description"]}>
              <AccordionItem value="description">
                <AccordionTrigger>{t("description")}</AccordionTrigger>
                <AccordionContent>
                  <div className="max-h-40 overflow-y-auto pr-1 text-sm leading-relaxed text-muted-foreground">
                    {localizedProductDescription(product)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Trashed product: read-only archive view — no buy / wishlist / variant picks */}
          {!discontinued && (
            <>
          <div className="mt-8">
            <p className="mb-3 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {t("color")}
              {activeColor ? (
                <span className="ml-2 normal-case tracking-normal text-foreground">
                  {localizedColorName(activeColor)}
                </span>
              ) : null}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.colors.map((c) => {
                const available = colorHasAnyStock(c.id);
                const selected = (colorId || product.colors[0].id) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    title={
                      available
                        ? localizedColorName(c)
                        : `${localizedColorName(c)} — ${t("colorUnavailable")}`
                    }
                    aria-label={localizedColorName(c)}
                    aria-pressed={selected}
                    aria-disabled={!available}
                    disabled={!available}
                    onClick={() => selectColor(c.id)}
                    className={cn(
                      "relative size-9 rounded-full border-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)] transition",
                      selected && available ? "border-ink" : "border-black/25",
                      !available && "cursor-not-allowed opacity-35 grayscale"
                    )}
                    style={{ backgroundColor: c.hex }}
                  >
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="block h-px w-[120%] rotate-45 bg-ink/80" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {product.colors.some((c) => !colorHasAnyStock(c.id)) &&
              product.colors.some((c) => colorHasAnyStock(c.id)) && (
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {t("unavailableHint")}
                </p>
              )}
          </div>

          <div className="mt-7">
            <p className="mb-3 text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {t("size")}
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const sStock = activeColor
                  ? stockFor(product.inventory, activeColor.id, s)
                  : 0;
                const selected = (size || product.sizes[0]) === s;
                const unavailable = sStock === 0;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={unavailable}
                    title={
                      unavailable
                        ? `${s} — ${t("sizeUnavailable")}`
                        : s
                    }
                    onClick={() => setSize(s)}
                    className={cn(
                      "flex size-11 items-center justify-center border text-sm transition",
                      selected && !unavailable
                        ? "border-ink bg-ink text-mist"
                        : "border-border bg-white hover:border-ink/40",
                      unavailable &&
                        "cursor-not-allowed bg-[#f3f2ef] text-muted-foreground line-through opacity-50"
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  !purchaseBlocked ? "text-emerald-700" : "text-destructive"
                )}
              >
                {!anyStock
                  ? t("allSoldOut")
                  : stock > 0
                    ? t("inStockShort")
                    : t("outOfStockShort")}
              </p>
              {stock > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t("inStock", {
                    stock,
                    color: activeColor ? localizedColorName(activeColor) : "",
                    size: activeSize ?? "",
                  })}
                </p>
              ) : (
                <p className="text-xs font-medium text-destructive">
                  {t("outOfStock", {
                    color: activeColor ? localizedColorName(activeColor) : "",
                    size: activeSize ?? "",
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              size="lg"
              onClick={handleAdd}
              disabled={purchaseBlocked}
              className="w-full bg-[#c41e3a] tracking-[0.12em] uppercase hover:bg-[#a81830] disabled:bg-ink/30 sm:min-w-[12rem] sm:flex-1"
            >
              <ShoppingBag className="size-4" />
              {purchaseBlocked ? t("soldOut") : t("buy")}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full bg-white sm:w-auto"
              onClick={async () => {
                try {
                  const next = await toggleWishlist(product.id);
                  toast.success(
                    next ? t("addedWishlist") : t("removedWishlist")
                  );
                } catch {
                  toast.error(t("wishlistError"));
                }
              }}
            >
              <Heart
                className={cn("size-4", wished && "fill-current text-destructive")}
              />
              {t("wishlist")}
            </Button>
            </div>
          </div>
            </>
          )}

          <div className="mt-10 space-y-6 border-t border-border pt-8">
            <div>
              <p className="mb-3 text-sm font-semibold">{t("details")}</p>
              <ul className="space-y-2.5 text-sm leading-relaxed text-foreground/80">
                {localizedProductDetails(product).map((d) => (
                  <li key={d} className="flex gap-3">
                    <span className="mt-1.5 size-1.5 shrink-0 bg-[#c41e3a]" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Accordion>
              {product.sizeChart && (
                <AccordionItem value="size" className="scroll-mt-24" id="size-guide">
                  <AccordionTrigger>{t("sizeGuide")}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3 text-xs text-muted-foreground">
                      {t("sizeHint")}
                    </p>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2">{t("size")}</th>
                          <th>{t("length")}</th>
                          <th>{t("width")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.sizeChart.map((row) => (
                          <tr
                            key={row.size}
                            className="border-b border-border/50"
                          >
                            <td className="py-2 font-medium">{row.size}</td>
                            <td>{row.length}</td>
                            <td>{row.width ?? row.chest ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="returns">
                <AccordionTrigger>{tNav("delivery")}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    Нова Пошта · 1–3 дні. Повернення протягом 14 днів.{" "}
                    <Link
                      href="/returns"
                      className="text-foreground underline underline-offset-2"
                    >
                      Детальніше
                    </Link>
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 text-2xl font-medium tracking-tight">
            {t("related")}
          </h2>
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
