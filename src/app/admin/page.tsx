"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, Plus, Trash2 } from "lucide-react";
import { ImageGalleryField } from "@/components/admin/image-gallery-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  COLOR_PALETTE,
  colorKeyFromName,
  colorNameFromKey,
  normalizeHex,
  paletteColorForKey,
} from "@/lib/color-palette";
import { CATEGORY_LABELS, ORDER_STATUS_LABELS } from "@/lib/demo-data";
import { formatUAH, totalStock } from "@/lib/format";
import type {
  Category,
  Order,
  OrderStatus,
  Product,
  ProductSize,
} from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

type SizeChartRow = {
  size: ProductSize;
  length: string;
  width: string;
};

type FormColor = {
  key: string;
  name: string;
  hex: string;
};

type Ticket = {
  id: string;
  email: string;
  message: string;
  status: string;
  telegramSent: boolean;
  createdAt: string;
};

type OrderRow = Order & {
  payments?: {
    id: string;
    provider: string;
    amount: number;
  }[];
};

const FLOW: OrderStatus[] = [
  "placed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const DEFAULT_DETAILS = [
  "В’язаний оверсайз-светр",
  "Принт портрета спереду, текст ззаду",
  "Прати при 30°C, вивернути навиворіт",
  "Зроблено в Україні",
];

function defaultSizeChart(sizesCsv: string): SizeChartRow[] {
  return sizesCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((size) => ({
      size: size as ProductSize,
      length: "",
      width: "",
    }));
}

function parseSizesCsv(sizesCsv: string): string[] {
  return sizesCsv
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
}

function defaultStockBySize(sizesCsv: string, qty = 8): Record<string, number> {
  return Object.fromEntries(parseSizesCsv(sizesCsv).map((s) => [s, qty]));
}

const emptyForm = () => ({
  name: "",
  slug: "",
  category: "sweaters" as Category,
  description: "",
  details: "",
  price: "2500",
  salePrice: "",
  figure: "",
  colors: [
    { key: "black", name: "Чорний", hex: "#111111" },
  ] as FormColor[],
  sizes: "S,M,L,XL",
  stockBySize: defaultStockBySize("S,M,L,XL", 8),
  images: [] as string[],
  tags: "",
  sizeChart: defaultSizeChart("S,M,L,XL") as SizeChartRow[],
});

function linesToList(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function productToForm(p: Product) {
  const sizes = p.sizes.length ? p.sizes.join(",") : "M";
  const primary = p.colors[0]?.id ?? "black";
  const stockBySize: Record<string, number> = {};
  for (const s of p.sizes) {
    stockBySize[s] = p.inventory[`${primary}:${s}`] ?? 0;
  }
  return {
    name: p.nameUk || p.name,
    slug: p.slug,
    category: p.category,
    description: p.descriptionUk || p.description,
    details: (p.detailsUk ?? p.details ?? []).join("\n"),
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    figure: p.figureUk || p.figure || "",
    colors: (p.colors.length
      ? p.colors.map((c) => ({
          key: c.id,
          name: c.nameUk || c.name,
          hex: c.hex,
        }))
      : [{ key: "black", name: "Чорний", hex: "#111111" }]) as FormColor[],
    sizes,
    stockBySize:
      Object.keys(stockBySize).length > 0
        ? stockBySize
        : defaultStockBySize(sizes, 0),
    images: [...p.images],
    tags: (p.tags ?? []).join(", "),
    sizeChart: (p.sizeChart?.length
      ? p.sizeChart.map((r) => ({
          size: r.size,
          length: r.length ?? "",
          width: r.width ?? r.chest ?? "",
        }))
      : defaultSizeChart(sizes)) as SizeChartRow[],
  };
}

export default function AdminPage() {
  const user = useShopStore((s) => s.user);
  const setProductsStore = useShopStore((s) => s.setProducts);
  const [products, setProducts] = useState<Product[]>([]);
  const [trash, setTrash] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [newColor, setNewColor] = useState({
    key: "",
    name: "",
    hex: "#E8E4DC",
    stock: 0,
  });
  const [newSize, setNewSize] = useState("");
  const [customColor, setCustomColor] = useState({
    name: "",
    hex: "#8B6F5C",
  });

  const reload = useCallback(async () => {
    const [p, tr, o, t] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/products?trash=1"),
      fetch("/api/orders?all=1"),
      fetch("/api/support"),
    ]);
    const pd = await p.json();
    const trd = await tr.json();
    const od = await o.json();
    const td = await t.json();
    if (pd.ok) {
      setProducts(pd.products);
      setProductsStore(pd.products);
    }
    if (trd.ok) setTrash(trd.products);
    if (od.ok) setOrders(od.orders);
    if (td.ok) setTickets(td.tickets);
    setLoading(false);
  }, [setProductsStore]);

  useEffect(() => {
    if (user?.role === "ADMIN") void reload();
    else setLoading(false);
  }, [user, reload]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Admin</h1>
        <p className="mt-2 text-muted-foreground">Увійдіть як адміністратор</p>
        <Button
          className="mt-6"
          render={<Link href="/auth/login?next=/admin" />}
        >
          Увійти
        </Button>
      </div>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Немає доступу</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
        Завантаження адмінки…
      </div>
    );
  }

  async function saveProduct() {
    const sizes = parseSizesCsv(form.sizes);
    const images = form.images;
    if (!form.name.trim()) {
      toast.error("Вкажіть назву");
      return;
    }
    if (!form.slug.trim()) {
      toast.error("Вкажіть slug");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Вкажіть опис");
      return;
    }
    if (!images.length) {
      toast.error("Додайте хоча б одне фото в галерею");
      return;
    }
    if (!form.colors.length) {
      toast.error("Додайте хоча б один колір");
      return;
    }
    if (!sizes.length) {
      toast.error("Додайте хоча б один розмір");
      return;
    }

    const price = Number(String(form.price).replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Ціна має бути числом більше 0");
      return;
    }
    const saleRaw = String(form.salePrice).trim();
    let salePrice: number | null = null;
    if (saleRaw !== "") {
      salePrice = Number(saleRaw.replace(",", "."));
      if (!Number.isFinite(salePrice) || salePrice <= 0) {
        toast.error("Sale ціна — число > 0 або порожньо");
        return;
      }
      if (salePrice >= price) {
        toast.error(
          "Sale ціна має бути меншою за звичайну — інакше не буде розпродажу"
        );
        return;
      }
    }

    const details = linesToList(form.details);
    const detailLines = details.length ? details : DEFAULT_DETAILS;
    const tags = form.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const sizeChart = form.sizeChart
      .filter((r) => sizes.includes(r.size) && (r.length || r.width))
      .map((r) => ({
        size: r.size,
        length: r.length || "—",
        width: r.width || undefined,
      }));

    const colors = form.colors.map((c) => {
      const preset = paletteColorForKey(c.key);
      const name = (c.name.trim() || preset?.name || colorNameFromKey(c.key)).trim();
      return {
        id: c.key,
        name,
        nameUk: name,
        hex: normalizeHex(preset?.hex ?? c.hex),
      };
    });

    const stockBySize: Record<string, number> = {};
    for (const s of sizes) {
      stockBySize[s] = Math.max(0, Number(form.stockBySize[s]) || 0);
    }

    const inventory: Record<string, number> = {};
    for (const c of colors) {
      for (const s of sizes) {
        inventory[`${c.id}:${s}`] = stockBySize[s] ?? 0;
      }
    }

    const payload = {
      name: form.name.trim(),
      nameUk: form.name.trim(),
      slug: form.slug.trim(),
      category: form.category,
      description: form.description.trim(),
      descriptionUk: form.description.trim(),
      details: detailLines,
      detailsUk: detailLines,
      price,
      salePrice,
      figure: form.figure.trim() || null,
      figureUk: form.figure.trim() || null,
      tags,
      sizeChart: sizeChart.length ? sizeChart : null,
      images,
      colors,
      sizes,
      stockBySize,
      inventory,
    };

    // Edit: sync colors + stock only for primary color sizes (інші кольори — «Склад»)
    const primaryKey = colors[0]?.id;
    const editInventory: Record<string, number> = {};
    if (primaryKey) {
      for (const s of sizes) {
        editInventory[`${primaryKey}:${s}`] = stockBySize[s] ?? 0;
      }
    }

    const body = editId
      ? {
          name: payload.name,
          nameUk: payload.nameUk,
          slug: payload.slug,
          category: payload.category,
          description: payload.description,
          descriptionUk: payload.descriptionUk,
          details: payload.details,
          detailsUk: payload.detailsUk,
          price: payload.price,
          salePrice: payload.salePrice,
          figure: payload.figure,
          figureUk: payload.figureUk,
          tags: payload.tags,
          sizeChart: payload.sizeChart,
          images: payload.images,
          colors: payload.colors,
          sizes: payload.sizes,
          inventory: editInventory,
        }
      : payload;

    const res = await fetch(editId ? `/api/products/${editId}` : "/api/products", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      toast.error(data.error ?? "Помилка");
      return;
    }
    toast.success(editId ? "Збережено в базі" : "Товар додано в базу");
    setEditId(null);
    setForm(emptyForm());
    await reload();
  }

  const existingColorsPool = (() => {
    const map = new Map<string, FormColor>();
    for (const p of products) {
      for (const c of p.colors) {
        if (!map.has(c.id)) {
          map.set(c.id, {
            key: c.id,
            name: c.nameUk || c.name,
            hex: c.hex,
          });
        }
      }
    }
    for (const c of COLOR_PALETTE) {
      if (!map.has(c.key)) map.set(c.key, { ...c });
    }
    return [...map.values()];
  })();

  function syncSizes(sizesCsv: string, prev = form) {
    const keys = parseSizesCsv(sizesCsv);
    const stockBySize: Record<string, number> = {};
    for (const s of keys) {
      stockBySize[s] = prev.stockBySize[s] ?? 8;
    }
    return {
      ...prev,
      sizes: sizesCsv,
      stockBySize,
      sizeChart: keys.map((size) => {
        const found = prev.sizeChart.find((r) => r.size === size);
        return (
          found ?? {
            size: size as ProductSize,
            length: "",
            width: "",
          }
        );
      }),
    };
  }

  function addFormColor(color: FormColor) {
    setForm((f) => {
      if (f.colors.some((c) => c.key === color.key)) {
        toast.message(`Колір «${color.name}» уже додано`);
        return f;
      }
      return { ...f, colors: [...f.colors, color] };
    });
  }

  const stockProduct =
    products.find((p) => p.id === stockProductId) ?? products[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Admin
            </p>
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              Панель магазину
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Зміни одразу в SQLite · {user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" render={<Link href="/catalog" />}>
              На сайт
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Товари", value: products.length },
            { label: "Замовлення", value: orders.length },
            {
              label: "Од. на складі",
              value: products.reduce((s, p) => s + totalStock(p.inventory), 0),
            },
            { label: "Тікети", value: tickets.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="border border-border bg-white px-4 py-4"
            >
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                {stat.label}
              </p>
              <p className="mt-1 text-2xl font-medium tabular-nums">{stat.value}</p>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
            {(
              [
                ["orders", `Замовлення (${orders.length})`],
                ["products", `Товари (${products.length})`],
                ["trash", `Смітник (${trash.length})`],
                ["stock", "Склад"],
                ["tickets", `Тікети (${tickets.length})`],
              ] as const
            ).map(([v, label]) => (
              <TabsTrigger
                key={v}
                value={v}
                className="rounded-none border border-border bg-white px-4 py-2 data-active:bg-ink data-active:text-mist"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="orders" className="space-y-3">
            {orders.length === 0 && (
              <p className="border border-dashed border-border bg-white p-10 text-center text-muted-foreground">
                Замовлень ще немає — оформіть тестове з сайту
              </p>
            )}
            {orders.map((o) => (
              <div
                key={o.id}
                className="grid gap-4 border border-border bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium">{o.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString("uk-UA")} ·{" "}
                    {o.customer.name} · {o.customer.email}
                  </p>
                  <p className="mt-1 text-sm">{formatUAH(o.total)}</p>
                  {o.payments?.[0] && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {o.payments[0].provider} · {formatUAH(o.payments[0].amount)}
                    </p>
                  )}
                  <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                    {o.items.map((i) => (
                      <li key={`${i.productId}-${i.size}-${i.colorId}`}>
                        {i.name} · {i.colorName} · {i.size} ×{i.qty}
                      </li>
                    ))}
                  </ul>
                </div>
                <Select
                  value={o.status}
                  onValueChange={async (v) => {
                    const res = await fetch(`/api/orders/${o.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: v }),
                    });
                    const data = await res.json();
                    if (!data.ok) toast.error(data.error);
                    else {
                      toast.success("Статус у базі оновлено");
                      await reload();
                    }
                  }}
                >
                  <SelectTrigger className="w-44 bg-white">
                    <SelectValue>
                      {(v) =>
                        ORDER_STATUS_LABELS[String(v ?? "")] ?? String(v ?? "")
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FLOW.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="products" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="border border-border bg-white p-5">
              <div className="mb-4 flex items-center gap-2">
                <Package className="size-4" />
                <h2 className="text-lg font-medium">
                  {editId ? "Редагувати товар" : "Новий товар"}
                </h2>
              </div>
              <p className="mb-4 text-xs text-muted-foreground">
                Усі поля опційні, крім назви, slug, опису, ціни, кольору, розміру
                й фото. Порожні блоки просто не показуються на сайті.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Назва</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Светр Шевченко"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="shevchenko-sweater"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Категорія</Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, category: v as Category }))
                    }
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue>
                        {(v) =>
                          CATEGORY_LABELS[String(v ?? "")] ?? String(v ?? "")
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(["sweaters", "tshirts", "scarves"] as const).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Опис</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="h-32 max-h-32"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Деталі — по одному рядку</Label>
                  <Textarea
                    value={form.details}
                    placeholder={"В’язаний оверсайз\nЗроблено в Україні"}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, details: e.target.value }))
                    }
                    className="h-28 max-h-28"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Фігура</Label>
                  <Input
                    value={form.figure}
                    placeholder="Тарас Шевченко"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, figure: e.target.value }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Показується над назвою на картці товару. Порожньо — ок.
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Теги пошуку (через кому)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="шевченко, shevchenko, портрет"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Працюють. Короткий пошук (1–2 символи) — лише по назві; від
                    3 символів — назва + фігура + slug + ці теги. Порожньо =
                    шукаємо без тегів.
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground sm:col-span-2">
                  Плашки: NEW — 30 днів після створення · SALE — якщо Sale ціна
                  &lt; звичайної · BESTSELLER — топ-3 за реальними продажами.
                  «Популярні» в каталозі — тільки статистика покупок, без
                  ручних пріоритетів.
                </p>
                <div className="space-y-1">
                  <Label>Ціна, грн</Label>
                  <Input
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.,]/g, "");
                      setForm((f) => ({ ...f, price: v }));
                    }}
                    placeholder="2500"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Sale ціна</Label>
                  <Input
                    inputMode="numeric"
                    value={form.salePrice}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d.,]/g, "");
                      setForm((f) => ({ ...f, salePrice: v }));
                    }}
                    placeholder="порожньо = без знижки"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Має бути меншою за ціну — тоді товар у «Розпродаж» і з
                    перекресленням.
                  </p>
                </div>

                <div className="space-y-3 sm:col-span-2">
                  <div>
                    <Label>Кольори</Label>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Обери з палітри — назва й колір кружка підставляються самі
                      з key (black → «Чорний»). Свій колір — вкажи назву, key
                      згенерується. Hex можна підкрутити вручну.
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {form.colors.map((c, i) => {
                      const preset = paletteColorForKey(c.key);
                      return (
                      <li
                        key={`${c.key}-${i}`}
                        className="grid gap-2 border border-border bg-[#faf9f7] p-2 sm:grid-cols-[auto_1fr_auto_auto] sm:items-end"
                      >
                        <span
                          className="size-9 shrink-0 self-center rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex }}
                          title={c.hex}
                        />
                        <div className="space-y-1">
                          <Label className="text-[10px]">
                            Назва для покупця
                            {preset ? " (з палітри)" : ""}
                          </Label>
                          <Input
                            value={c.name}
                            onChange={(e) => {
                              const name = e.target.value;
                              const fromName = colorKeyFromName(name);
                              const hit = paletteColorForKey(fromName);
                              setForm((f) => {
                                const colors = [...f.colors];
                                colors[i] = hit
                                  ? { key: hit.key, name: hit.name, hex: hit.hex }
                                  : {
                                      ...c,
                                      name,
                                      key: fromName || c.key,
                                    };
                                return { ...f, colors };
                              });
                            }}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            id: <span className="font-mono">{c.key || "—"}</span>
                          </p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">hex</Label>
                          <Input
                            type="color"
                            value={
                              /^#[0-9a-fA-F]{6}$/.test(c.hex)
                                ? c.hex
                                : "#111111"
                            }
                            onChange={(e) => {
                              const hex = e.target.value.toUpperCase();
                              setForm((f) => {
                                const colors = [...f.colors];
                                colors[i] = { ...c, hex };
                                return { ...f, colors };
                              });
                            }}
                            className="h-8 w-12 cursor-pointer p-0.5"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={form.colors.length <= 1}
                          className="text-[#9b1c1c]"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              colors: f.colors.filter((_, j) => j !== i),
                            }))
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                      );
                    })}
                  </ul>
                  <div className="flex flex-wrap gap-1.5">
                    {existingColorsPool.map((c) => {
                      const active = form.colors.some((x) => x.key === c.key);
                      return (
                        <button
                          key={c.key}
                          type="button"
                          title={`${c.name} (${c.key})`}
                          disabled={active}
                          onClick={() => addFormColor(c)}
                          className={cn(
                            "inline-flex items-center gap-1.5 border px-2 py-1 text-[11px] transition",
                            active
                              ? "border-ink/30 bg-ink/5 opacity-50"
                              : "border-border bg-white hover:border-ink/50"
                          )}
                        >
                          <span
                            className="size-3 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-end gap-2 border border-dashed border-border p-2">
                    <div className="min-w-[8rem] flex-1 space-y-1">
                      <Label className="text-[10px]">Свій колір — назва</Label>
                      <Input
                        value={customColor.name}
                        onChange={(e) =>
                          setCustomColor({
                            ...customColor,
                            name: e.target.value,
                          })
                        }
                        placeholder="Теракота"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">hex</Label>
                      <Input
                        type="color"
                        value={customColor.hex}
                        onChange={(e) =>
                          setCustomColor({
                            ...customColor,
                            hex: e.target.value.toUpperCase(),
                          })
                        }
                        className="h-8 w-12 cursor-pointer p-0.5"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const name = customColor.name.trim();
                        if (!name) {
                          toast.error("Вкажіть назву кольору");
                          return;
                        }
                        addFormColor({
                          key: colorKeyFromName(name),
                          name,
                          hex: normalizeHex(customColor.hex),
                        });
                        setCustomColor({ name: "", hex: "#8B6F5C" });
                      }}
                    >
                      <Plus className="size-3.5" />
                      Додати колір
                    </Button>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label>Розміри (через кому)</Label>
                  <Input
                    value={form.sizes}
                    onChange={(e) => setForm(syncSizes(e.target.value))}
                    placeholder="S,M,L,XL"
                  />
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {["XS", "S", "M", "L", "XL", "XXL", "ONE"].map((s) => {
                      const have = parseSizesCsv(form.sizes).includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const cur = parseSizesCsv(form.sizes);
                            const next = have
                              ? cur.filter((x) => x !== s)
                              : [...cur, s];
                            setForm(syncSizes(next.join(",")));
                          }}
                          className={cn(
                            "border px-2.5 py-1 text-xs",
                            have
                              ? "border-ink bg-ink text-mist"
                              : "border-border bg-white"
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Сток на кожен розмір</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Окреме число для кожного розміру (однакове для всіх кольорів
                    при збереженні з форми). Детальніше по кольорах — вкладка
                    «Склад».
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {parseSizesCsv(form.sizes).map((s) => (
                      <div key={s} className="space-y-1">
                        <Label className="text-[10px]">{s}</Label>
                        <Input
                          inputMode="numeric"
                          value={String(form.stockBySize[s] ?? 0)}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^\d]/g, "");
                            setForm((f) => ({
                              ...f,
                              stockBySize: {
                                ...f.stockBySize,
                                [s]: raw === "" ? 0 : Number(raw),
                              },
                            }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                      <Label>Розмірна сітка (см)</Label>
                      <p className="text-[11px] text-muted-foreground">
                        a = довжина · b = ширина по грудях. Порожні рядки не
                        зберігаються. Рядки з’являються з розмірів вище.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const size = window.prompt(
                          "Новий розмір для сітки (напр. XXL)",
                          "XXL"
                        );
                        if (!size?.trim()) return;
                        const s = size.trim().toUpperCase();
                        const cur = parseSizesCsv(form.sizes);
                        if (!cur.includes(s)) cur.push(s);
                        setForm(syncSizes(cur.join(",")));
                      }}
                    >
                      <Plus className="size-3.5" />
                      Розмір у сітку
                    </Button>
                  </div>
                  <div className="overflow-x-auto border border-border bg-white">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                          <th className="px-3 py-2">Size</th>
                          <th className="px-3 py-2">Довжина (a)</th>
                          <th className="px-3 py-2">Ширина (b)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {form.sizeChart.map((row, i) => (
                          <tr
                            key={row.size}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-3 py-2 font-medium">{row.size}</td>
                            <td className="px-3 py-1.5">
                              <Input
                                value={row.length}
                                onChange={(e) => {
                                  const sizeChart = [...form.sizeChart];
                                  sizeChart[i] = {
                                    ...row,
                                    length: e.target.value,
                                  };
                                  setForm({ ...form, sizeChart });
                                }}
                                className="h-8"
                                placeholder="66"
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <Input
                                value={row.width}
                                onChange={(e) => {
                                  const sizeChart = [...form.sizeChart];
                                  sizeChart[i] = {
                                    ...row,
                                    width: e.target.value,
                                  };
                                  setForm({ ...form, sizeChart });
                                }}
                                className="h-8"
                                placeholder="64"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <ImageGalleryField
                  images={form.images}
                  livePersist={Boolean(editId)}
                  onChange={(images) => {
                    setForm((f) => ({ ...f, images }));
                    if (!editId) return;
                    const id = editId;
                    // миттєве превʼю в списку
                    setProducts((ps) =>
                      ps.map((p) => (p.id === id ? { ...p, images } : p))
                    );
                    void (async () => {
                      try {
                        const res = await fetch(`/api/products/${id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ images }),
                        });
                        const data = await res.json();
                        if (!data.ok || !data.product) {
                          toast.error(data.error ?? "Не вдалося зберегти фото");
                          await reload();
                          return;
                        }
                        const saved = data.product as Product;
                        setForm((f) =>
                          editId === id ? { ...f, images: saved.images } : f
                        );
                        setProducts((ps) =>
                          ps.map((p) => (p.id === id ? saved : p))
                        );
                        setProductsStore(
                          useShopStore
                            .getState()
                            .products.map((p) => (p.id === id ? saved : p))
                        );
                      } catch {
                        toast.error("Не вдалося зберегти фото");
                      }
                    })();
                  }}
                />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => void saveProduct()}>
                  <Plus className="size-4" />
                  {editId ? "Зберегти в базу" : "Додати в базу"}
                </Button>
                {editId && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditId(null);
                      setForm(emptyForm());
                    }}
                  >
                    Скасувати
                  </Button>
                )}
              </div>
            </div>

            <ul className="space-y-2">
              {products.map((p) => (
                <li
                  key={p.id}
                  className="flex gap-3 border border-border bg-white p-3"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden bg-[#eee]">
                    {p.images[0] && (
                      <Image
                        key={p.images[0]}
                        src={p.images[0]}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{p.nameUk || p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatUAH(p.salePrice ?? p.price)}
                      {p.salePrice ? " · SALE" : ""} · stock{" "}
                      {totalStock(p.inventory)} · {p.colors.length} кол. ·{" "}
                      {p.sizes.join("/")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditId(p.id);
                          setForm(productToForm(p));
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setStockProductId(p.id);
                          setActiveTab("stock");
                        }}
                      >
                        Склад
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:bg-[#9b1c1c]/10 hover:text-[#9b1c1c]"
                        onClick={async () => {
                          const label = p.nameUk || p.name;
                          if (
                            !confirm(
                              `Перемістити «${label}» у смітник?\nЗникне з каталогу; з історії замовлень ще можна відкрити сторінку.`
                            )
                          ) {
                            return;
                          }
                          const res = await fetch(`/api/products/${p.id}`, {
                            method: "DELETE",
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!data.ok) {
                            toast.error(data.error ?? "Не вдалося видалити");
                            return;
                          }
                          if (editId === p.id) {
                            setEditId(null);
                            setForm(emptyForm());
                          }
                          if (stockProductId === p.id) setStockProductId(null);
                          setProducts((list) =>
                            list.filter((x) => x.id !== p.id)
                          );
                          toast.success("У смітнику");
                          await reload();
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="trash" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Товари у смітнику приховані з каталогу. З історії замовлень
              сторінку ще можна відкрити (без купівлі). «Видалити назавжди» —
              повне стирання з БД + архів-знімок на бекенді; у замовленнях
              лишається лише текст/фото, без посилання.
            </p>
            {trash.length === 0 && (
              <p className="border border-dashed border-border bg-white p-10 text-center text-muted-foreground">
                Смітник порожній
              </p>
            )}
            <ul className="space-y-2">
              {trash.map((p) => (
                <li
                  key={p.id}
                  className="flex gap-3 border border-border bg-white p-3"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden bg-[#eee]">
                    {p.images[0] && (
                      <Image
                        src={p.images[0]}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover opacity-60"
                        sizes="64px"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.nameUk || p.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.slug} · у смітнику
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const res = await fetch(`/api/products/${p.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ active: true }),
                          });
                          const data = await res.json();
                          if (!data.ok) {
                            toast.error(data.error ?? "Помилка");
                            return;
                          }
                          toast.success("Відновлено в каталозі");
                          await reload();
                        }}
                      >
                        Відновити
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#9b1c1c] hover:bg-[#9b1c1c]/10 hover:text-[#9b1c1c]"
                        onClick={async () => {
                          const label = p.nameUk || p.name;
                          if (
                            !confirm(
                              `Видалити «${label}» НАЗАВЖДИ з бази?\nУ замовленнях лишиться знімок без посилання. Архів збережеться для відновлення на бекенді.`
                            )
                          ) {
                            return;
                          }
                          const res = await fetch(
                            `/api/products/${p.id}?permanent=1`,
                            { method: "DELETE" }
                          );
                          const data = await res.json().catch(() => ({}));
                          if (!data.ok) {
                            toast.error(data.error ?? "Помилка");
                            return;
                          }
                          toast.success("Видалено назавжди (+ архів)");
                          await reload();
                        }}
                      >
                        <Trash2 className="size-4" />
                        Назавжди
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStockProductId(p.id)}
                  className={cn(
                    "cursor-pointer border px-3 py-1.5 text-sm",
                    (stockProduct?.id ?? products[0]?.id) === p.id
                      ? "border-ink bg-ink text-mist"
                      : "border-border bg-white"
                  )}
                >
                  {p.nameUk || p.name}
                  {p.colors.length > 1 ? ` · ${p.colors.length} кол.` : ""}
                </button>
              ))}
            </div>
            {stockProduct && (
              <div className="space-y-4 border border-border bg-white p-4">
                <div>
                  <h2 className="mb-1 text-lg font-medium">
                    {stockProduct.nameUk || stockProduct.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Сток: blur → одразу в базу. 0 = недоступно. Нижче — додати
                    колір або розмір до цієї ж моделі (ті самі дані товару).
                  </p>
                </div>

                <div className="grid gap-3 border border-dashed border-border bg-[#faf9f7] p-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <p className="text-sm font-medium">+ Колір (та сама модель)</p>
                  </div>
                  <div className="space-y-1">
                    <Label>key (black, bone…)</Label>
                    <Input
                      value={newColor.key}
                      onChange={(e) =>
                        setNewColor({ ...newColor, key: e.target.value })
                      }
                      placeholder="bone"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>hex</Label>
                    <Input
                      value={newColor.hex}
                      onChange={(e) =>
                        setNewColor({ ...newColor, hex: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Назва кольору</Label>
                    <Input
                      value={newColor.name}
                      onChange={(e) =>
                        setNewColor({ ...newColor, name: e.target.value })
                      }
                      placeholder="Молочний"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Сток на кожен розмір</Label>
                    <Input
                      type="number"
                      value={newColor.stock}
                      onChange={(e) =>
                        setNewColor({
                          ...newColor,
                          stock: Number(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={async () => {
                        if (!newColor.key.trim() || !newColor.name.trim()) {
                          toast.error("Потрібні key і назва кольору");
                          return;
                        }
                        const res = await fetch(
                          `/api/products/${stockProduct.id}`,
                          {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              addColor: {
                                ...newColor,
                                nameUk: newColor.name,
                              },
                            }),
                          }
                        );
                        const data = await res.json();
                        if (!data.ok) {
                          toast.error(data.error ?? "Помилка");
                          return;
                        }
                        toast.success(`Колір ${newColor.name} додано`);
                        setNewColor({
                          key: "",
                          name: "",
                          hex: "#E8E4DC",
                          stock: 0,
                        });
                        await reload();
                      }}
                    >
                      <Plus className="size-4" />
                      Додати колір
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 border border-dashed border-border bg-[#faf9f7] p-3">
                  <div className="min-w-[8rem] flex-1 space-y-1">
                    <Label>+ Розмір (для всіх кольорів)</Label>
                    <Input
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      placeholder="XL"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (!newSize.trim()) {
                        toast.error("Вкажіть розмір");
                        return;
                      }
                      const res = await fetch(
                        `/api/products/${stockProduct.id}`,
                        {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            addSize: newSize.trim(),
                            addSizeStock: 0,
                          }),
                        }
                      );
                      const data = await res.json();
                      if (!data.ok) {
                        toast.error(data.error ?? "Помилка");
                        return;
                      }
                      toast.success(`Розмір ${newSize.trim().toUpperCase()} додано`);
                      setNewSize("");
                      await reload();
                    }}
                  >
                    <Plus className="size-4" />
                    Додати розмір
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-3">Колір</th>
                        {stockProduct.sizes.map((s) => (
                          <th key={s} className="px-1 py-2 text-center">
                            {s}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {stockProduct.colors.map((c) => (
                        <tr key={c.id} className="border-b border-border/60">
                          <td className="py-2 pr-3">
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="size-3 rounded-full border border-black/25"
                                style={{ backgroundColor: c.hex }}
                              />
                              {c.nameUk || c.name}
                              <span className="text-[10px] text-muted-foreground">
                                {c.id}
                              </span>
                            </span>
                          </td>
                          {stockProduct.sizes.map((s) => {
                            const key = `${c.id}:${s}`;
                            const qty = stockProduct.inventory[key] ?? 0;
                            return (
                              <td key={key} className="px-1 py-1.5">
                                <Input
                                  type="number"
                                  className={cn(
                                    "h-9 text-center tabular-nums",
                                    qty === 0 && "border-destructive/40"
                                  )}
                                  defaultValue={qty}
                                  key={`${key}-${qty}`}
                                  onBlur={async (e) => {
                                    const stock = Math.max(
                                      0,
                                      Number(e.target.value) || 0
                                    );
                                    const res = await fetch(
                                      `/api/products/${stockProduct.id}`,
                                      {
                                        method: "PATCH",
                                        headers: {
                                          "Content-Type": "application/json",
                                        },
                                        body: JSON.stringify({
                                          inventory: { [key]: stock },
                                        }),
                                      }
                                    );
                                    const data = await res.json();
                                    if (data.ok) {
                                      toast.success(
                                        `${c.name} ${s} → ${stock}`
                                      );
                                      await reload();
                                    } else toast.error(data.error);
                                  }}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-3">
            {tickets.length === 0 && (
              <p className="border border-dashed border-border bg-white p-10 text-center text-muted-foreground">
                Тікетів немає
              </p>
            )}
            {tickets.map((t) => (
              <div key={t.id} className="border border-border bg-white p-4 text-sm">
                <p className="font-medium">
                  {t.email} · {t.status}
                  {t.telegramSent ? " · TG" : ""}
                </p>
                <p className="mt-1 text-muted-foreground">{t.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString("uk-UA")}
                </p>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
