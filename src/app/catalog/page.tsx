"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { CATEGORY_LABELS } from "@/lib/demo-data";
import { totalStock } from "@/lib/format";
import type { Category, ProductSize } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { useRouter } from "next/navigation";

function CatalogInner() {
  const params = useSearchParams();
  const router = useRouter();
  const products = useShopStore((s) => s.products);

  const category = (params.get("category") as Category | "all" | null) ?? "all";
  const q = params.get("q")?.toLowerCase() ?? "";
  const size = params.get("size") as ProductSize | null;
  const color = params.get("color");
  const inStock = params.get("inStock") === "1";
  const sort = params.get("sort") ?? "featured";

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    router.push(`/catalog?${next.toString()}`);
  }

  const allColors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; hex: string }>();
    products.forEach((p) => p.colors.forEach((c) => map.set(c.id, c)));
    return [...map.values()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.figure?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.includes(q))
      );
    }
    if (size) {
      list = list.filter((p) =>
        p.sizes.includes(size) &&
        p.colors.some((c) => (p.inventory[`${c.id}:${size}`] ?? 0) > 0 || !inStock)
      );
    }
    if (color) {
      list = list.filter((p) => p.colors.some((c) => c.id === color));
    }
    if (inStock) {
      list = list.filter((p) => totalStock(p.inventory) > 0);
    }
    if (sort === "price-asc") list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price-desc") list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    if (sort === "new") list.sort((a, b) => Number(b.newArrival) - Number(a.newArrival));
    if (sort === "featured") list.sort((a, b) => Number(b.featured) - Number(a.featured));
    return list;
  }, [products, category, q, size, color, inStock, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">Shop</p>
          <h1 className="font-display mt-1 text-4xl font-bold tracking-tight">Каталог</h1>
          <p className="mt-2 text-muted-foreground">
            {q ? `Пошук: «${params.get("q")}» · ` : ""}
            {filtered.length} товарів
          </p>
        </div>
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
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <aside className="space-y-7">
          <div>
            <p className="mb-2.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Розмір
            </p>
            <div className="flex flex-wrap gap-2">
              {(["S", "M", "L", "XL", "ONE"] as ProductSize[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setParam("size", size === s ? null : s)}
                  className={`pressable min-w-10 border px-2.5 py-1.5 text-sm transition-colors ${
                    size === s ? "border-ink bg-ink text-mist" : "border-border bg-white hover:border-ink/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Колір
            </p>
            <div className="flex flex-wrap gap-2.5">
              {allColors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  title={c.name}
                  onClick={() => setParam("color", color === c.id ? null : c.id)}
                  className={`size-7 rounded-full border-2 transition ${
                    color === c.id ? "border-ink scale-110" : "border-transparent ring-1 ring-border"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="instock"
              checked={inStock}
              onCheckedChange={(v) => setParam("inStock", v ? "1" : null)}
            />
            <Label htmlFor="instock">Лише в наявності</Label>
          </div>
          <div>
            <p className="mb-2.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Сортування
            </p>
            <Select value={sort} onValueChange={(v) => setParam("sort", v ?? "featured")}>
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Рекомендовані</SelectItem>
                <SelectItem value="new">Новинки</SelectItem>
                <SelectItem value="price-asc">Ціна ↑</SelectItem>
                <SelectItem value="price-desc">Ціна ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="border border-dashed border-border bg-white/60 p-12 text-center">
              <p className="font-medium">Нічого не знайдено</p>
              <p className="mt-1 text-sm text-muted-foreground">Спробуйте інші фільтри</p>
            </div>
          ) : (
            <div className="product-grid grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 md:gap-y-10">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Завантаження…</div>}>
      <CatalogInner />
    </Suspense>
  );
}
