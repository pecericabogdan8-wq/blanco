"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { totalStock } from "@/lib/format";
import { buildVariantSku } from "@/lib/sku";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

function invKey(colorKey: string, size: string) {
  return `${colorKey}:${size}`;
}

type WriteoffRow = {
  id: string;
  productName: string;
  productSku?: string | null;
  variantSku?: string | null;
  colorName: string;
  size: string;
  qty: number;
  note?: string | null;
  createdAt: string;
};

export function WriteoffDialog({
  open,
  onOpenChange,
  products,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  onDone: () => Promise<void> | void;
}) {
  const [query, setQuery] = useState("");
  const [productId, setProductId] = useState<string | null>(null);
  const [colorKey, setColorKey] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState<WriteoffRow[]>([]);
  const [panel, setPanel] = useState<"form" | "journal">("form");

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/writeoffs");
      const data = await res.json();
      if (data.ok) setHistory(data.writeoffs ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (open) void loadHistory();
  }, [open, loadHistory]);

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? null,
    [products, productId]
  );

  const choices = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!q) return true;
      const name = (p.nameUk || p.name).toLowerCase();
      const sku = (p.sku ?? "").toLowerCase();
      return (
        name.includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        sku.includes(q)
      );
    });
  }, [products, query]);

  const variantCode =
    product && colorKey && size
      ? buildVariantSku(product.sku || product.slug, colorKey, size)
      : null;

  function resetSelection(p: Product) {
    setProductId(p.id);
    setColorKey(p.colors[0]?.id ?? "");
    setSize(p.sizes[0] ?? "");
    setQty("1");
    setNote("");
  }

  async function submit() {
    if (!product) {
      toast.error("Оберіть товар");
      return;
    }
    const c = colorKey || product.colors[0]?.id || "";
    const s = size || product.sizes[0] || "";
    const n = Math.max(1, Number(qty) || 1);
    if (!c || !s) {
      toast.error("Оберіть колір і розмір");
      return;
    }
    const key = invKey(c, s);
    const have = Math.max(0, product.inventory[key] ?? 0);
    if (n > have) {
      toast.error(`На складі лише ${have}`);
      return;
    }
    const color = product.colors.find((x) => x.id === c);
    const inventory = { ...product.inventory, [key]: have - n };
    const res = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inventory }),
    });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.error ?? "Помилка списання");
      return;
    }

    const tip = note.trim();
    const code =
      variantCode ??
      buildVariantSku(product.sku || product.slug, c, s);
    await fetch("/api/writeoffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        productName: product.nameUk || product.name,
        productSku: product.sku || null,
        variantSku: code,
        colorKey: c,
        colorName: color?.nameUk || color?.name || c,
        size: s,
        qty: n,
        note: tip || null,
      }),
    });

    toast.success(
      tip ? `Списано ${n} × ${code} (${tip})` : `Списано ${n} × ${code}`
    );
    setQty("1");
    setNote("");
    await loadHistory();
    await onDone();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setQuery("");
          setProductId(null);
          setColorKey("");
          setSize("");
          setQty("1");
          setNote("");
          setPanel("form");
        }
      }}
    >
      <DialogContent
        className="max-h-[min(92vh,760px)] overflow-y-auto rounded-none sm:max-w-3xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-display text-[1.85rem] leading-none sm:text-[2.15rem]">
            Списання зі складу
          </DialogTitle>
          <DialogDescription>
            {panel === "form"
              ? "Бартер, офлайн-продаж або порча — мінусуємо залишок без замовлення."
              : "Історія списань з коментарями. Коментар зберігається в базі."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 border border-border p-1">
          <button
            type="button"
            onClick={() => setPanel("form")}
            className={cn(
              "flex-1 px-3 py-2 text-sm",
              panel === "form" ? "bg-ink text-mist" : "bg-white hover:bg-[#faf9f7]"
            )}
          >
            Списати
          </button>
          <button
            type="button"
            onClick={() => {
              setPanel("journal");
              void loadHistory();
            }}
            className={cn(
              "flex-1 px-3 py-2 text-sm",
              panel === "journal"
                ? "bg-ink text-mist"
                : "bg-white hover:bg-[#faf9f7]"
            )}
          >
            Історія списань
            {history.length > 0 ? ` (${history.length})` : ""}
          </button>
        </div>

        {panel === "journal" ? (
          <div>
            {history.length === 0 ? (
              <p className="border border-dashed border-border bg-[#faf9f7] px-4 py-10 text-center text-sm text-muted-foreground">
                Поки порожньо — після списання записи зʼявляться тут.
              </p>
            ) : (
              <ul className="h-[min(52vh,420px)] space-y-2 overflow-y-auto border border-border p-2">
                {history.map((row) => (
                  <li
                    key={row.id}
                    className="border border-border bg-[#faf9f7] px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">
                        −{row.qty} · {row.productName}
                      </p>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {new Date(row.createdAt).toLocaleString("uk-UA")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {row.variantSku || `${row.colorName} · ${row.size}`}
                      {row.note ? ` · ${row.note}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <div className="space-y-3">
            <Label htmlFor="writeoff-search">Товар</Label>
            <Input
              id="writeoff-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Назва або артикул…"
              className="bg-white"
            />
            <ul className="max-h-[240px] space-y-1 overflow-y-auto border border-border sm:max-h-[300px]">
              {choices.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Нічого не знайдено
                </li>
              )}
              {choices.map((p) => {
                const stock = totalStock(p.inventory);
                const selected = productId === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => resetSelection(p)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#faf9f7]",
                        selected && "bg-ink/5 ring-1 ring-inset ring-ink/20"
                      )}
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden bg-[#eee]">
                        {p.images[0] && (
                          <Image
                            src={p.images[0]}
                            alt=""
                            fill
                            unoptimized
                            className="object-cover"
                            sizes="48px"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {p.nameUk || p.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {p.sku || p.slug}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {stock}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="space-y-4">
            {!product ? (
              <p className="border border-dashed border-border bg-[#faf9f7] px-4 py-10 text-center text-sm text-muted-foreground">
                Оберіть товар — покажемо залишки по кольорах і розмірах
              </p>
            ) : (
              <>
                <div>
                  <p className="font-medium">
                    {product.nameUk || product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.sku || product.slug} ·{" "}
                    {totalStock(product.inventory)} од.
                  </p>
                  {variantCode && (
                    <p className="mt-1 font-mono text-[11px] tracking-wide text-foreground/80">
                      {variantCode}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Колір</Label>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map((c) => {
                      const active = colorKey === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          title={c.nameUk || c.name}
                          onClick={() => {
                            setColorKey(c.id);
                            setSize((prev) =>
                              prev && product.sizes.includes(prev as never)
                                ? prev
                                : product.sizes[0] ?? ""
                            );
                          }}
                          className={cn(
                            "inline-flex items-center gap-2 border px-2.5 py-1.5 text-xs",
                            active
                              ? "border-ink bg-ink text-mist"
                              : "border-border bg-white"
                          )}
                        >
                          <span
                            className="size-3 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.nameUk || c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {colorKey && (
                  <div className="space-y-2">
                    <Label>Розмір і залишок</Label>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((s) => {
                        const key = invKey(colorKey, s);
                        const qtyCell = product.inventory[key] ?? 0;
                        const active = size === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            disabled={qtyCell <= 0}
                            onClick={() => setSize(s)}
                            className={cn(
                              "border px-3 py-2 text-xs tabular-nums",
                              qtyCell <= 0 && "opacity-40",
                              active
                                ? "border-ink bg-ink text-mist"
                                : "border-border bg-white"
                            )}
                          >
                            {s} · {qtyCell}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                  <div className="space-y-1">
                    <Label htmlFor="writeoff-qty">К-сть</Label>
                    <Input
                      id="writeoff-qty"
                      inputMode="numeric"
                      className="w-20 bg-white tabular-nums"
                      value={qty}
                      onChange={(e) =>
                        setQty(e.target.value.replace(/[^\d]/g, ""))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="writeoff-note">Коментар</Label>
                    <Textarea
                      id="writeoff-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="бартер, офлайн, брак…"
                      className="min-h-[4rem] bg-white"
                    />
                  </div>
                </div>

                <Button type="button" onClick={() => void submit()}>
                  Списати
                </Button>
              </>
            )}
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
