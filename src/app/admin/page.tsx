"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { ArrowLeft, ChevronDown, Package, Plus, Trash2 } from "lucide-react";
import { ImageGalleryField } from "@/components/admin/image-gallery-field";
import { WriteoffDialog } from "@/components/admin/writeoff-dialog";
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
import {
  COLOR_PALETTE,
  colorKeyFromName,
  colorNameFromKey,
  normalizeHex,
  paletteColorForKey,
} from "@/lib/color-palette";
import { CATEGORY_LABELS, ORDER_STATUS_LABELS } from "@/lib/demo-data";
import { availableColorSizes, formatUAH, totalStock } from "@/lib/format";
import { isBestseller, isProductNew } from "@/lib/product-badges";
import type {
  Category,
  Order,
  OrderStatus,
  Product,
  ProductSize,
} from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import {
  RETURN_ADMIN_HINTS,
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
} from "@/lib/return-mapper";
import type { ReturnRequestStatus } from "@prisma/client";
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

type ReturnRow = {
  id: string;
  orderId: string;
  email: string;
  phone?: string;
  reason: keyof typeof RETURN_REASON_LABELS;
  message: string;
  adminNote?: string;
  status: ReturnRequestStatus;
  restoreStock: boolean;
  refundWanted: boolean;
  createdAt: string;
  order?: {
    id: string;
    total: number;
    customerName: string;
  };
};

const FLOW: OrderStatus[] = [
  "placed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
];

const ORDER_STATUS_CHIP: Record<OrderStatus, string> = {
  placed: "bg-sky-100 text-sky-800 ring-sky-200",
  paid: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  processing: "bg-amber-100 text-amber-800 ring-amber-200",
  shipped: "bg-violet-100 text-violet-800 ring-violet-200",
  delivered: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  returned: "bg-orange-100 text-orange-900 ring-orange-200",
  cancelled: "bg-[#9b1c1c]/10 text-[#9b1c1c] ring-[#9b1c1c]/20",
};

function invKey(colorKey: string, size: string) {
  return `${colorKey}:${size}`;
}

function FormSection({
  eyebrow,
  title,
  children,
  className,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "space-y-3 border border-border bg-white p-4 sm:p-5",
        className
      )}
    >
      <div>
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
          {eyebrow}
        </p>
        <h3 className="text-base font-medium tracking-tight">{title}</h3>
      </div>
      {children}
    </section>
  );
}

type ReturnAction = { status: ReturnRequestStatus; label: string };

function returnActionsFor(status: ReturnRequestStatus): ReturnAction[] {
  switch (status) {
    case "requested":
      return [
        { status: "approved", label: "Схвалити" },
        { status: "rejected", label: "Відхилити" },
      ];
    case "approved":
      return [
        { status: "awaiting_parcel", label: "Чекаємо посилку" },
        { status: "sent_back", label: "Відхилити після перевірки" },
      ];
    case "awaiting_parcel":
      return [
        { status: "received", label: "Отримано OK" },
        { status: "sent_back", label: "Брак умов — назад клієнту" },
      ];
    case "received":
      return [
        { status: "refunded", label: "Повернути кошти" },
        { status: "exchanged", label: "Обмін" },
        { status: "closed", label: "Закрити" },
      ];
    default:
      return [];
  }
}

function emptySizeChart(sizesCsv: string): SizeChartRow[] {
  return parseSizesCsv(sizesCsv).map((size) => ({
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

const emptyForm = () => ({
  name: "",
  slug: "",
  sku: "",
  category: "sweaters" as Category | "",
  description: "",
  details: "",
  price: "",
  salePrice: "",
  figure: "",
  colors: [] as FormColor[],
  sizes: "",
  inventory: {} as Record<string, string>,
  images: [] as string[],
  tags: "",
  sizeChart: [] as SizeChartRow[],
});

function linesToList(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function productToForm(p: Product) {
  const sizes = p.sizes.join(",");
  const inventory: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.inventory)) {
    inventory[k] = String(v);
  }
  return {
    name: p.nameUk || p.name,
    slug: p.slug,
    sku: p.sku ?? "",
    category: p.category as Category | "",
    description: p.descriptionUk || p.description,
    details: (p.detailsUk ?? p.details ?? []).join("\n"),
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    figure: p.figureUk || p.figure || "",
    colors: p.colors.map((c) => ({
      key: c.id,
      name: c.nameUk || c.name,
      hex: c.hex,
    })) as FormColor[],
    sizes,
    inventory,
    images: [...p.images],
    tags: (p.tags ?? []).join(", "),
    sizeChart: (p.sizeChart?.length
      ? p.sizeChart.map((r) => ({
          size: r.size,
          length: r.length ?? "",
          width: r.width ?? r.chest ?? "",
        }))
      : emptySizeChart(sizes)) as SizeChartRow[],
  };
}

export default function AdminPage() {
  const user = useShopStore((s) => s.user);
  const setProductsStore = useShopStore((s) => s.setProducts);
  const [products, setProducts] = useState<Product[]>([]);
  const [trash, setTrash] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [returns, setReturns] = useState<ReturnRow[]>([]);
  const [bestsellerIds, setBestsellerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [writeoffOpen, setWriteoffOpen] = useState(false);
  const [returnAdminNotes, setReturnAdminNotes] = useState<
    Record<string, string>
  >({});
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("products");
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [productsView, setProductsView] = useState<"catalog" | "trash">(
    "catalog"
  );
  const [customColor, setCustomColor] = useState({
    name: "",
    hex: "#8B6F5C",
  });

  const reload = useCallback(async () => {
    const [p, tr, o, t, r, b] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/products?trash=1"),
      fetch("/api/orders?all=1"),
      fetch("/api/support"),
      fetch("/api/returns"),
      fetch("/api/stats/bestsellers?limit=3"),
    ]);
    const pd = await p.json();
    const trd = await tr.json();
    const od = await o.json();
    const td = await t.json();
    const rd = await r.json();
    const bd = await b.json();
    if (pd.ok) {
      setProducts(pd.products);
      setProductsStore(pd.products);
    }
    if (trd.ok) setTrash(trd.products);
    if (od.ok) setOrders(od.orders);
    if (td.ok) setTickets(td.tickets);
    if (rd.ok) setReturns(rd.returns);
    if (bd.ok && Array.isArray(bd.products)) {
      setBestsellerIds(bd.products.map((x: Product) => x.id));
    }
    setLoading(false);
  }, [setProductsStore]);

  useEffect(() => {
    if (user?.role === "ADMIN") void reload();
    else setLoading(false);
  }, [user, reload]);

  const fillNextSku = useCallback(async (category?: Category | "") => {
    const cat = (category || "sweaters") as Category;
    try {
      const res = await fetch(
        `/api/products?nextSku=1&category=${encodeURIComponent(cat)}`
      );
      const data = await res.json();
      if (data.ok && data.sku) {
        setForm((f) => ({ ...f, sku: String(data.sku) }));
      }
    } catch {
      /* ignore preview errors */
    }
  }, []);

  const resetCreateForm = useCallback(() => {
    setEditId(null);
    setForm(emptyForm());
    void fillNextSku("sweaters");
  }, [fillNextSku]);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    if (editId) return;
    if (form.sku.trim()) return;
    void fillNextSku(form.category || "sweaters");
  }, [user?.role, editId, form.sku, form.category, fillNextSku]);

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
    if (!form.category) {
      toast.error("Оберіть категорію");
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

    const detailLines = linesToList(form.details);
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
      const name = (
        c.name.trim() ||
        preset?.name ||
        colorNameFromKey(c.key)
      ).trim();
      return {
        id: c.key,
        name,
        nameUk: name,
        hex: normalizeHex(preset?.hex ?? c.hex),
      };
    });

    const inventory: Record<string, number> = {};
    for (const c of colors) {
      for (const s of sizes) {
        const key = invKey(c.id, s);
        const raw = String(form.inventory[key] ?? "").trim();
        inventory[key] = Math.max(0, raw === "" ? 0 : Number(raw) || 0);
      }
    }

    const skuTrim = form.sku.trim();
    const body = {
      name: form.name.trim(),
      nameUk: form.name.trim(),
      slug: form.slug.trim(),
      // SKU is system-managed: send only on create; never editable in UI
      ...(editId ? {} : skuTrim ? { sku: skuTrim } : {}),
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
      inventory,
    };

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
    resetCreateForm();
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
    const inventory: Record<string, string> = {};
    for (const [k, v] of Object.entries(prev.inventory)) {
      const sizePart = k.split(":").pop();
      if (sizePart && keys.includes(sizePart)) {
        inventory[k] = v;
      }
    }
    return {
      ...prev,
      sizes: sizesCsv,
      inventory,
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

  function removeFormColor(colorKey: string) {
    setForm((f) => {
      const inventory = { ...f.inventory };
      for (const k of Object.keys(inventory)) {
        if (k.startsWith(`${colorKey}:`)) delete inventory[k];
      }
      return {
        ...f,
        colors: f.colors.filter((c) => c.key !== colorKey),
        inventory,
      };
    });
  }

  return (
    <div className="min-h-screen bg-[#f3f2ef]">
      <div className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div>
            <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
              Admin
            </p>
            <h1 className="font-display text-2xl tracking-tight sm:text-3xl">
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

        <div className="mb-6 flex flex-wrap gap-1">
            {(
              [
                ["products", `Товари (${products.length})`],
                ["orders", `Замовлення (${orders.length})`],
                ["returns", `Повернення (${returns.length})`],
                ["tickets", `Тікети (${tickets.length})`],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                className={cn(
                  "rounded-none border border-border bg-white px-3 py-2 text-sm sm:px-4",
                  activeTab === v && "bg-ink text-mist"
                )}
                onClick={() => {
                  setActiveTab(v);
                  if (v === "products") setProductsView("catalog");
                }}
              >
                {label}
              </button>
            ))}
          </div>


          {activeTab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 && (
              <p className="border border-dashed border-border bg-white p-10 text-center text-muted-foreground">
                Замовлень ще немає — оформіть тестове з сайту
              </p>
            )}
            {orders.map((o) => {
              const open = openOrderId === o.id;
              return (
                <div
                  key={o.id}
                  className="border border-border bg-white"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#faf9f7]"
                    onClick={() =>
                      setOpenOrderId(open ? null : o.id)
                    }
                  >
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{o.id}</p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
                            ORDER_STATUS_CHIP[o.status]
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              o.status === "placed" && "bg-sky-500",
                              o.status === "paid" && "bg-indigo-500",
                              o.status === "processing" && "bg-amber-500",
                              o.status === "shipped" && "bg-violet-500",
                              o.status === "delivered" && "bg-emerald-500",
                              o.status === "returned" && "bg-orange-500",
                              o.status === "cancelled" && "bg-[#9b1c1c]"
                            )}
                          />
                          {ORDER_STATUS_LABELS[o.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {o.customer.name} · {o.customer.email}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-medium tabular-nums">
                      {formatUAH(o.total)}
                    </p>
                  </button>
                  {open && (
                    <div className="space-y-3 border-t border-border px-4 py-4 pl-11">
                      <ul className="space-y-1 text-sm">
                        {o.items.map((i) => (
                          <li
                            key={`${i.productId}-${i.size}-${i.colorId}`}
                            className="text-muted-foreground"
                          >
                            {i.name} · {i.colorName} · {i.size}
                              {i.sku ? (
                                <span className="ml-1 font-mono text-[10px] text-muted-foreground">
                                  {i.sku}
                                </span>
                              ) : null}{" "}
                              ×{i.qty} —{" "}
                            {formatUAH(i.price * i.qty)}
                          </li>
                        ))}
                      </ul>
                      <div className="grid gap-2 text-sm sm:grid-cols-2">
                        <p>
                          <span className="text-muted-foreground">Телефон: </span>
                          {o.customer.phone || "—"}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Оплата: </span>
                          {o.paymentMethod}
                        </p>
                        <p className="sm:col-span-2">
                          <span className="text-muted-foreground">
                            Доставка:{" "}
                          </span>
                          {o.customer.city}, {o.customer.address}
                          {o.customer.novaPoshta
                            ? ` · НП ${o.customer.novaPoshta}`
                            : ""}
                        </p>
                        <p>
                          <span className="text-muted-foreground">
                            Доставка, грн:{" "}
                          </span>
                          {formatUAH(o.shipping)}
                        </p>
                        {o.payments?.[0] && (
                          <p>
                            <span className="text-muted-foreground">
                              Платіж:{" "}
                            </span>
                            {o.payments[0].provider} ·{" "}
                            {formatUAH(o.payments[0].amount)}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground sm:col-span-2">
                          {new Date(o.createdAt).toLocaleString("uk-UA")}
                        </p>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`ttn-${o.id}`}>ТТН Нова Пошта</Label>
                          <div className="flex flex-wrap gap-2">
                            <Input
                              id={`ttn-${o.id}`}
                              defaultValue={o.customer.novaPoshtaTtn ?? ""}
                              placeholder="204…"
                              className="max-w-xs bg-white"
                              onBlur={async (e) => {
                                const v = e.target.value.trim();
                                const res = await fetch(`/api/orders/${o.id}`, {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ novaPoshtaTtn: v }),
                                });
                                const data = await res.json();
                                if (!data.ok) toast.error(data.error);
                                else toast.success("ТТН збережено");
                              }}
                            />
                            <p className="text-xs text-muted-foreground self-center">
                              Збережеться при втраті фокусу
                            </p>
                          </div>
                        </div>
                      </div>
                      <Select
                        value={o.status}
                        onValueChange={async (v) => {
                          const next = String(v ?? "");
                          const res = await fetch(`/api/orders/${o.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: next }),
                          });
                          const data = await res.json();
                          if (!data.ok) toast.error(data.error);
                          else {
                            const msg =
                              next === "cancelled" || next === "returned"
                                ? "Статус оновлено · сток повернуто на склад"
                                : "Статус у базі оновлено";
                            toast.success(msg);
                            await reload();
                          }
                        }}
                      >
                        <SelectTrigger className="w-full max-w-xs bg-white">
                          <SelectValue>
                            {(v) =>
                              ORDER_STATUS_LABELS[String(v ?? "")] ??
                              String(v ?? "")
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
                  )}
                </div>
              );
            })}
          </div>
          )}

          {activeTab === "returns" && (
          <div className="space-y-4">
            <p className="border border-border bg-[#faf9f7] px-4 py-3 text-sm text-muted-foreground">
              Заявки з сайту. «Отримано OK» / «Повернути кошти» / «Обмін» повертають
              одиниці на склад один раз (якщо ще не повернуто через скасування
              замовлення). «Назад клієнту» сток не повертає. «Повернути кошти»
              також ставить платіж у статус refunded (без реального LiqPay).
            </p>
            {returns.length === 0 && (
              <p className="border border-dashed border-border bg-white p-10 text-center text-muted-foreground">
                Заявок на повернення ще немає
              </p>
            )}
            <ul className="space-y-3">
              {returns.map((rr) => {
                const actions = returnActionsFor(rr.status);
                const noteDraft =
                  returnAdminNotes[rr.id] ?? rr.adminNote ?? "";
                return (
                  <li
                    key={rr.id}
                    className="border border-border bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {rr.orderId} · {RETURN_REASON_LABELS[rr.reason]}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {rr.email}
                          {rr.phone ? ` · ${rr.phone}` : ""}
                        </p>
                        <p className="mt-2 text-sm">{rr.message}</p>
                        <p className="mt-2 text-[11px] text-muted-foreground">
                          {new Date(rr.createdAt).toLocaleString("uk-UA")} ·{" "}
                          {rr.refundWanted ? "повернення коштів" : "обмін"}
                          {rr.restoreStock ? " · сток повернуто" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex rounded-full bg-[#f3f2ef] px-2.5 py-1 text-[11px] font-medium ring-1 ring-border">
                          {RETURN_STATUS_LABELS[rr.status]}
                        </span>
                        <p className="mt-2 max-w-xs text-left text-xs text-muted-foreground sm:text-right">
                          {RETURN_ADMIN_HINTS[rr.status]}
                        </p>
                      </div>
                    </div>
                    {actions.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {actions.map(({ status, label }) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await fetch(`/api/returns/${rr.id}`, {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  status,
                                  adminNote: noteDraft.trim() || undefined,
                                }),
                              });
                              const data = await res.json();
                              if (!data.ok) {
                                toast.error(data.error ?? "Помилка");
                                return;
                              }
                              toast.success(
                                data.stockRestored
                                  ? `${label} · сток на складі оновлено`
                                  : label
                              );
                              await reload();
                            }}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 space-y-1">
                      <Label htmlFor={`return-note-${rr.id}`} className="text-xs">
                        Нотатка адміна
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        <Input
                          id={`return-note-${rr.id}`}
                          className="max-w-md bg-white"
                          placeholder="Внутрішня нотатка для команди…"
                          value={noteDraft}
                          onChange={(e) =>
                            setReturnAdminNotes((m) => ({
                              ...m,
                              [rr.id]: e.target.value,
                            }))
                          }
                          onBlur={async () => {
                            const v = noteDraft.trim();
                            if (v === (rr.adminNote ?? "")) return;
                            const res = await fetch(`/api/returns/${rr.id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({ adminNote: v }),
                            });
                            const data = await res.json();
                            if (!data.ok) toast.error(data.error ?? "Помилка");
                          }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          )}

          {activeTab === "products" && (
          <div className="space-y-4">
            {productsView === "trash" ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium">Смітник</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductsView("catalog")}
                  >
                    <ArrowLeft className="size-3.5" />
                    До товарів
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Товари у смітнику приховані з каталогу. З історії замовлень
                  сторінку ще можна відкрити (без купівлі). «Видалити назавжди» —
                  повне стирання з БД + архів-знімок на бекенді; у замовленнях
                  лишається лише текст/фото, без посилання.
                </p>
                {trash.length === 0 && (
                  <p className="border border-dashed border-border bg-white p-8 text-center text-muted-foreground sm:p-10">
                    Смітник порожній
                  </p>
                )}
                <ul className="grid gap-2 sm:grid-cols-1">
                  {trash.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-3 border border-border bg-white p-3 sm:flex-row sm:items-start"
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
                          {p.sku || p.slug} · у смітнику
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const res = await fetch(`/api/products/${p.id}`, {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({ active: true }),
                              });
                              const data = await res.json();
                              if (!data.ok) {
                                toast.error(data.error ?? "Помилка");
                                return;
                              }
                              toast.success("Відновлено в каталозі");
                              setProductsView("catalog");
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
              </div>
            ) : (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <div className="space-y-4">
              <div className="border border-border bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Package className="size-4 shrink-0" />
                  <h2 className="text-lg font-medium">
                    {editId ? "Редагувати товар" : "Новий товар"}
                  </h2>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Обовʼязкові: назва, slug, категорія, опис, ціна, колір, розмір
                  і фото. Списання офлайн — вкладка «Списання».
                </p>
              </div>

              <FormSection eyebrow="Каталог" title="Основне">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Назва</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="напр. Светр Шевченко"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Slug (URL)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="напр. shevchenko-sweater"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Артикул</Label>
                  <div className="flex min-h-8 items-center border border-border bg-[#f7f6f3] px-2.5 py-1.5">
                    <p
                      className={cn(
                        "font-mono text-sm tracking-wide uppercase text-foreground",
                        !form.sku.trim() && "text-muted-foreground"
                      )}
                    >
                      {form.sku.trim() || "генерується…"}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Присвоюється автоматично, змінити не можна. Варіанти —
                    артикул + колір + розмір.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Категорія</Label>
                  <Select
                    value={form.category || null}
                    onValueChange={(v) => {
                      const cat = (v ?? "") as Category | "";
                      setForm((f) => ({ ...f, category: cat }));
                      if (!editId && cat) {
                        void fillNextSku(cat);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Оберіть категорію">
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
              </div>
              </FormSection>

              <FormSection eyebrow="Контент" title="Опис">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <Label>Опис</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Короткий опис товару для сторінки"
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
              </div>
              </FormSection>

              <FormSection eyebrow="Магазин" title="Ціна">
              <div className="grid gap-3 sm:grid-cols-2">
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
              </div>
              </FormSection>

              <FormSection eyebrow="Варіанти" title="Кольори">
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">
                    Обери з палітри — назва й колір кружка підставляються самі
                    з key (black → «Чорний»). Свій колір — вкажи назву, key
                    згенерується. Hex можна підкрутити вручну.
                  </p>
                  {form.colors.length === 0 && (
                    <p className="border border-dashed border-border bg-[#faf9f7] px-3 py-4 text-center text-xs text-muted-foreground">
                      Кольорів ще немає — обери з палітри нижче або додай свій
                    </p>
                  )}
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
                            placeholder="напр. Чорний"
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
                          className="text-[#9b1c1c]"
                          onClick={() => removeFormColor(c.key)}
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
              </FormSection>

              <FormSection eyebrow="Склад" title="Розміри і склад">
                <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Розміри (через кому)</Label>
                  <Input
                    value={form.sizes}
                    onChange={(e) => setForm(syncSizes(e.target.value))}
                    placeholder="напр. S,M,L,XL"
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

                <div className="space-y-2">
                  <Label>Склад — колір × розмір</Label>
                  <p className="text-[11px] text-muted-foreground">
                    Кожна клітинка = залишок на колір×розмір. Порожньо = 0.
                  </p>
                  {form.colors.length === 0 ||
                  parseSizesCsv(form.sizes).length === 0 ? (
                    <p className="border border-dashed border-border bg-[#faf9f7] px-3 py-4 text-center text-xs text-muted-foreground">
                      Додай кольори та розміри вище — зʼявиться таблиця
                    </p>
                  ) : (
                    <>
                      <div className="overflow-x-auto border border-border bg-white">
                        <table className="w-full min-w-[320px] text-sm">
                          <thead>
                            <tr className="border-b border-border text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                              <th className="px-2 py-2 sm:px-3">Колір</th>
                              {parseSizesCsv(form.sizes).map((s) => (
                                <th
                                  key={s}
                                  className="px-1 py-2 text-center font-medium"
                                >
                                  {s}
                                </th>
                              ))}
                              <th className="px-2 py-2 text-center font-medium">
                                Σ
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {form.colors.map((c) => {
                              const sizes = parseSizesCsv(form.sizes);
                              const rowSum = sizes.reduce((acc, s) => {
                                const raw = String(
                                  form.inventory[invKey(c.key, s)] ?? ""
                                ).trim();
                                return acc + (raw === "" ? 0 : Number(raw) || 0);
                              }, 0);
                              return (
                                <tr
                                  key={c.key}
                                  className="border-b border-border last:border-0"
                                >
                                  <td className="px-2 py-1.5 sm:px-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm">
                                      <span
                                        className="size-3 shrink-0 rounded-full border border-black/20"
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name || c.key}
                                      />
                                      <span
                                        className="max-w-[5rem] truncate sm:max-w-none"
                                        title={c.name || c.key}
                                      >
                                        {c.name || c.key}
                                      </span>
                                    </span>
                                  </td>
                                  {sizes.map((s) => {
                                    const key = invKey(c.key, s);
                                    const val = form.inventory[key] ?? "";
                                    return (
                                      <td key={key} className="px-1 py-1">
                                        <Input
                                          inputMode="numeric"
                                          className={cn(
                                            "h-8 min-w-[2.5rem] text-center tabular-nums",
                                            val === "0" &&
                                              "border-destructive/40"
                                          )}
                                          value={val}
                                          placeholder="0"
                                          onChange={(e) => {
                                            const raw = e.target.value.replace(
                                              /[^\d]/g,
                                              ""
                                            );
                                            setForm((f) => ({
                                              ...f,
                                              inventory: {
                                                ...f.inventory,
                                                [key]: raw,
                                              },
                                            }));
                                          }}
                                        />
                                      </td>
                                    );
                                  })}
                                  <td className="px-2 py-1.5 text-center text-xs font-medium tabular-nums text-muted-foreground">
                                    {rowSum}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-[#faf9f7] text-[11px] text-muted-foreground">
                              <td className="px-2 py-2 sm:px-3">Разом</td>
                              {parseSizesCsv(form.sizes).map((s) => {
                                const col = form.colors.reduce((acc, c) => {
                                  const raw = String(
                                    form.inventory[invKey(c.key, s)] ?? ""
                                  ).trim();
                                  return (
                                    acc + (raw === "" ? 0 : Number(raw) || 0)
                                  );
                                }, 0);
                                return (
                                  <td
                                    key={`sum-${s}`}
                                    className="px-1 py-2 text-center tabular-nums font-medium"
                                  >
                                    {col}
                                  </td>
                                );
                              })}
                              <td className="px-2 py-2 text-center font-semibold tabular-nums text-foreground">
                                {Object.values(form.inventory).reduce(
                                  (a, v) =>
                                    a +
                                    (String(v).trim() === ""
                                      ? 0
                                      : Number(v) || 0),
                                  0
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
                </div>
              </FormSection>

              <FormSection eyebrow="Розміри" title="Розмірна сітка">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
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
                  {form.sizeChart.length === 0 ? (
                    <p className="border border-dashed border-border bg-[#faf9f7] px-3 py-4 text-center text-xs text-muted-foreground">
                      Рядки зʼявляться після вибору розмірів
                    </p>
                  ) : (
                    <div className="overflow-x-auto border border-border bg-white">
                      <table className="w-full min-w-[280px] text-sm">
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
                              <td className="px-3 py-2 font-medium">
                                {row.size}
                              </td>
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
                                  placeholder="напр. 66"
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
                                  placeholder="напр. 64"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </FormSection>

              <FormSection eyebrow="Медіа" title="Фото">
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
              </FormSection>

              <div className="sticky bottom-2 z-10 flex flex-wrap gap-2 border border-border bg-white/95 p-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
                <Button onClick={() => void saveProduct()}>
                  <Plus className="size-4" />
                  {editId ? "Зберегти" : "Додати в базу"}
                </Button>
                {editId && (
                  <Button
                    variant="outline"
                    onClick={() => resetCreateForm()}
                  >
                    Скасувати
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium">У каталозі</h3>
                <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWriteoffOpen(true)}
                >
                  <Package className="size-3.5" />
                  Списання
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setProductsView("trash")}
                  className={cn(
                    "relative transition-colors hover:border-[#9b1c1c]/50 hover:bg-[#9b1c1c]/10 hover:text-[#9b1c1c]",
                    trash.length === 0 && "text-muted-foreground"
                  )}
                >
                  <Trash2 className="size-3.5" />
                  Смітник
                  {trash.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#9b1c1c] px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
                      {trash.length > 99 ? "99+" : trash.length}
                    </span>
                  )}
                </Button>
                </div>
              </div>
              {products.length === 0 && (
                <p className="border border-dashed border-border bg-white p-8 text-center text-sm text-muted-foreground">
                  Товарів ще немає
                </p>
              )}
              <ul className="space-y-2">
                {products.map((p) => {
                  const stock = totalStock(p.inventory);
                  const variants = availableColorSizes(p.colors, p.inventory);
                  return (
                    <li
                      key={p.id}
                      className="flex gap-3 border border-border bg-white p-3"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden bg-[#eee] sm:size-16">
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
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-medium">
                            {p.nameUk || p.name}
                          </p>
                          {p.salePrice != null && p.salePrice < p.price && (
                            <span className="bg-ink px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase">
                              Sale
                            </span>
                          )}
                          {isBestseller(p.id, bestsellerIds) && (
                            <span className="bg-ink px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase">
                              Bestseller
                            </span>
                          )}
                          {isProductNew(p) && (
                            <span className="bg-[#3d5c4a] px-1.5 py-0.5 text-[9px] tracking-[0.12em] text-mist uppercase">
                              New
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
                          {p.sku || p.slug}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-baseline gap-2 text-xs">
                          {p.salePrice != null && p.salePrice < p.price ? (
                            <>
                              <span className="font-medium text-[#c41e3a] tabular-nums">
                                {formatUAH(p.salePrice)}
                              </span>
                              <span className="text-muted-foreground line-through tabular-nums">
                                {formatUAH(p.price)}
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground tabular-nums">
                              {formatUAH(p.price)}
                            </span>
                          )}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                          {variants.length === 0 ? (
                            <span className="text-[#9b1c1c]">
                              немає в наявності
                            </span>
                          ) : (
                            variants.map((v, i) => (
                              <span
                                key={v.id}
                                className="inline-flex items-center gap-1.5"
                                title={`${v.name}: ${v.sizes.join(", ")}`}
                              >
                                {i > 0 ? (
                                  <span className="text-border/80" aria-hidden>
                                    ,
                                  </span>
                                ) : null}
                                <span
                                  className="size-2.5 shrink-0 rounded-full border border-black/20"
                                  style={{ backgroundColor: v.hex }}
                                  title={v.name}
                                  aria-label={v.name}
                                />
                                <span className="tabular-nums text-foreground/80">
                                  {v.sizes.join("/")}
                                </span>
                              </span>
                            ))
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditId(p.id);
                              setForm(productToForm(p));
                              if (
                                typeof window !== "undefined" &&
                                window.innerWidth < 1024
                              ) {
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:border-[#9b1c1c]/30 hover:bg-[#9b1c1c]/10 hover:text-[#9b1c1c]"
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
                                resetCreateForm();
                              }
                              setProducts((list) =>
                                list.filter((x) => x.id !== p.id)
                              );
                              toast.success("У смітнику", {
                                action: {
                                  label: "Відкрити",
                                  onClick: () => setProductsView("trash"),
                                },
                              });
                              await reload();
                            }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-2xl font-medium tabular-nums sm:text-3xl">
                          {stock}
                        </p>
                        <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                          на складі
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
            </div>
            )}
          </div>
          )}

          {activeTab === "tickets" && (
          <div className="space-y-3">
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
          </div>
          )}
      <WriteoffDialog
        open={writeoffOpen}
        onOpenChange={setWriteoffOpen}
        products={products}
        onDone={reload}
      />
      </div>
    </div>
  );
}
