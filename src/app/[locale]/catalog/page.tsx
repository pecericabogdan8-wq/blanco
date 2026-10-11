"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  localizedColorName,
  productMatchesQuery,
} from "@/lib/localize-product";
import { isProductNew } from "@/lib/product-badges";
import { sortSizes, totalStock } from "@/lib/format";
import type { Category, Product, ProductSize } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function CatalogInner() {
  const t = useTranslations("Catalog");
  const tCat = useTranslations("Categories");
  const params = useSearchParams();
  const router = useRouter();
  const storeProducts = useShopStore((s) => s.products);
  const setProducts = useShopStore((s) => s.setProducts);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [bestsellerIds, setBestsellerIds] = useState<string[]>([]);
  const products = storeProducts.length > 0 ? storeProducts : localProducts;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return;
        setLocalProducts(d.products);
        setProducts(d.products);
      })
      .catch((err) => console.error("catalog fetch", err));
    return () => {
      cancelled = true;
    };
  }, [setProducts]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/bestsellers?limit=24")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok) return;
        // Only real sales — never featured fallback
        setBestsellerIds(
          Array.isArray(d.salesTopIds) ? (d.salesTopIds as string[]) : []
        );
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const category = (params.get("category") as Category | "all" | null) ?? "all";
  const q = params.get("q") ?? "";
  const size = params.get("size") as ProductSize | null;
  const color = params.get("color");
  const inStock = params.get("inStock") === "1";
  const rawSort = params.get("sort");
  const sort =
    !rawSort || rawSort === "featured" ? "popular" : rawSort;
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  function setParam(key: string, value: string | null, resetPage = true) {
    const current = params.get(key);
    const normalized =
      !value || value === "all" || (key === "sort" && value === "popular")
        ? null
        : value;
    if ((current ?? null) === normalized && !resetPage) return;
    const next = new URLSearchParams(params.toString());
    if (normalized == null) next.delete(key);
    else next.set(key, normalized);
    if (resetPage && key !== "page") next.delete("page");
    const qs = next.toString();
    router.push(qs ? `/catalog?${qs}` : "/catalog");
  }

  /** Facet pool: same scope as list before size/color filters (category + search + stock). */
  const facetProducts = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (q) list = list.filter((p) => productMatchesQuery(p, q));
    if (inStock) list = list.filter((p) => totalStock(p.inventory) > 0);
    return list;
  }, [products, category, q, inStock]);

  const allColors = useMemo(() => {
    const map = new Map<string, (typeof products)[0]["colors"][0]>();
    facetProducts.forEach((p) => p.colors.forEach((c) => map.set(c.id, c)));
    return [...map.values()];
  }, [facetProducts]);

  const allSizes = useMemo(() => {
    const set = new Set<string>();
    facetProducts.forEach((p) => p.sizes.forEach((s) => set.add(String(s))));
    return sortSizes([...set]) as ProductSize[];
  }, [facetProducts]);

  const filtered = useMemo(() => {
    let list = [...facetProducts];
    if (size) {
      list = list.filter(
        (p) =>
          p.sizes.includes(size) &&
          p.colors.some(
            (c) => (p.inventory[`${c.id}:${size}`] ?? 0) > 0 || !inStock
          )
      );
    }
    if (color) {
      list = list.filter((p) => p.colors.some((c) => c.id === color));
    }
    if (sort === "price-asc") {
      list.sort(
        (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
      );
    } else if (sort === "price-desc") {
      list.sort(
        (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
      );
    } else if (sort === "new") {
      list.sort((a, b) => {
        const byNew = Number(isProductNew(b)) - Number(isProductNew(a));
        if (byNew !== 0) return byNew;
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
    } else {
      // Popular = real sales rank only; no sales → newest first (createdAt)
      const rank = new Map(bestsellerIds.map((id, i) => [id, i]));
      list.sort((a, b) => {
        const hasA = rank.has(a.id);
        const hasB = rank.has(b.id);
        if (hasA && hasB) return rank.get(a.id)! - rank.get(b.id)!;
        if (hasA !== hasB) return hasA ? -1 : 1;
        return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
      });
    }
    return list;
  }, [facetProducts, size, color, inStock, sort, bestsellerIds]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const hasActiveFilters = Boolean(size || color || inStock);

  const countLabel = t(
    filtered.length === 1
      ? "items_one"
      : filtered.length >= 2 && filtered.length <= 4
        ? "items_few"
        : "items_many",
    { count: filtered.length }
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
      <div className="mb-5 sm:mb-6">
        {q ? (
          <div className="mb-5 border border-border bg-white px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
              {t("searchResultsTitle")}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-medium tracking-tight sm:text-xl">
                {t("searchQueryLabel")}{" "}
                <span className="text-foreground">«{q}»</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params.toString());
                  next.delete("q");
                  next.delete("page");
                  const qs = next.toString();
                  router.push(qs ? `/catalog?${qs}` : "/catalog");
                }}
                className="inline-flex items-center gap-1.5 border border-ink/20 bg-[#f6f5f2] px-3 py-2 text-[12px] tracking-[0.08em] text-foreground uppercase transition-colors duration-200 hover:border-ink hover:bg-ink hover:text-white"
              >
                {t("cancelSearch")}
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{countLabel}</p>
          </div>
        ) : (
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
            {t("title")}
          </h1>
        )}
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {(["all", "sweaters", "tshirts", "scarves"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setParam("category", c)}
            className={`shop-chip pressable ${
              category === c ? "shop-chip-active" : "shop-chip-idle"
            }`}
          >
            {tCat(c)}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[180px_1fr] lg:gap-12">
        <aside className="space-y-6 border-b border-border pb-6 lg:border-b-0 lg:pb-0">
          <div>
            <p className="mb-2.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              {t("size")}
            </p>
            <div className="flex flex-wrap gap-2">
              {allSizes.length === 0 ? (
                <p className="text-xs text-muted-foreground">—</p>
              ) : (
                allSizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setParam("size", size === s ? null : s)}
                    className={cn(
                      "pressable min-w-10 border px-2.5 py-1.5 text-sm transition-colors",
                      size === s
                        ? "border-ink bg-ink text-mist"
                        : "border-border bg-white hover:border-ink/40"
                    )}
                  >
                    {s}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              {t("color")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={localizedColorName(c)}
                  onClick={() =>
                    setParam("color", color === c.id ? null : c.id)
                  }
                  className={cn(
                    "size-7 rounded-full border-2 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.18)] transition",
                    color === c.id
                      ? "scale-110 border-ink"
                      : "border-black/30"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          <label
            htmlFor="instock"
            className={cn(
              "flex cursor-pointer items-center gap-2.5 border px-3 py-2.5 transition-colors",
              inStock
                ? "border-ink bg-ink text-mist"
                : "border-border bg-white hover:border-ink/35"
            )}
          >
            <Checkbox
              id="instock"
              checked={inStock}
              onCheckedChange={(v) => setParam("inStock", v ? "1" : null)}
              className={cn(
                "size-[1.125rem] rounded-[3px] border-2",
                inStock
                  ? "border-mist data-checked:border-mist data-checked:bg-mist data-checked:text-ink"
                  : "border-ink/55 bg-white"
              )}
            />
            <span className="text-sm">{t("inStockOnly")}</span>
          </label>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params.toString());
                next.delete("size");
                next.delete("color");
                next.delete("inStock");
                next.delete("page");
                const qs = next.toString();
                router.push(qs ? `/catalog?${qs}` : "/catalog");
              }}
              className="hover-brand-text cursor-pointer text-[12px] tracking-wide text-muted-foreground underline-offset-4 hover:underline"
            >
              {t("resetFilters")}
            </button>
          ) : null}
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">{countLabel}</p>
            <span className="text-border" aria-hidden>
              ·
            </span>
            <label className="flex items-center gap-1.5">
              <span className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                {t("sort")}
              </span>
              <Select
                value={sort}
                onValueChange={(v) => setParam("sort", v ?? "popular")}
              >
                <SelectTrigger className="h-9 w-auto min-w-0 justify-start gap-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 [&_[data-slot=select-value]]:!flex-none [&_[data-slot=select-value]]:!grow-0 [&_[data-slot=select-value]]:!basis-auto">
                  <SelectValue className="!flex-none !grow-0">
                    {sort === "new"
                      ? t("sortNew")
                      : sort === "price-asc"
                        ? t("sortPriceAsc")
                        : sort === "price-desc"
                          ? t("sortPriceDesc")
                          : t("sortPopular")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="popular">{t("sortPopular")}</SelectItem>
                  <SelectItem value="new">{t("sortNew")}</SelectItem>
                  <SelectItem value="price-asc">{t("sortPriceAsc")}</SelectItem>
                  <SelectItem value="price-desc">
                    {t("sortPriceDesc")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          {filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-white/60 p-12 text-center">
              <p className="font-medium">{t("emptyTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("emptyHint")}
              </p>
            </div>
          ) : (
            <>
              <div className="product-grid grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10">
                {pageItems.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    bestsellerIds={bestsellerIds}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
                  <p className="text-sm text-muted-foreground">
                    {t("page", { page: safePage, pages: totalPages })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() =>
                        setParam(
                          "page",
                          safePage <= 2 ? null : String(safePage - 1),
                          false
                        )
                      }
                      className="cursor-pointer border border-border bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("prevPage")}
                    </button>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() =>
                        setParam("page", String(safePage + 1), false)
                      }
                      className="cursor-pointer border border-border bg-white px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t("nextPage")}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const t = useTranslations("Catalog");
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-muted-foreground">
          {t("loading")}
        </div>
      }
    >
      <CatalogInner />
    </Suspense>
  );
}
