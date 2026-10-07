"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
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
import { CATEGORY_LABELS, ORDER_STATUS_LABELS } from "@/lib/demo-data";
import { formatUAH, totalStock } from "@/lib/format";
import type {
  Category,
  OrderStatus,
  Product,
  ProductColor,
  ProductSize,
} from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

const SIZES: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "ONE"];
const FLOW: OrderStatus[] = [
  "placed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const emptyForm = (): Partial<Product> & {
  colorName: string;
  colorHex: string;
  sizeList: string;
} => ({
  name: "",
  slug: "",
  category: "sweaters",
  description: "",
  price: 1990,
  salePrice: undefined,
  figure: "",
  colorName: "Чорний",
  colorHex: "#111111",
  sizeList: "S,M,L,XL",
  details: ["Зроблено в Україні"],
  tags: [],
  featured: false,
});

export default function AdminPage() {
  const products = useShopStore((s) => s.products);
  const orders = useShopStore((s) => s.orders);
  const tickets = useShopStore((s) => s.tickets);
  const upsertProduct = useShopStore((s) => s.upsertProduct);
  const deleteProduct = useShopStore((s) => s.deleteProduct);
  const setInventory = useShopStore((s) => s.setInventory);
  const updateOrderStatus = useShopStore((s) => s.updateOrderStatus);
  const resetDemo = useShopStore((s) => s.resetDemo);

  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState<string | null>(null);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [orders]
  );

  function startEdit(p: Product) {
    setEditId(p.id);
    setForm({
      ...p,
      colorName: p.colors[0]?.name ?? "Чорний",
      colorHex: p.colors[0]?.hex ?? "#111111",
      sizeList: p.sizes.join(","),
    });
  }

  function saveProduct() {
    if (!form.name || !form.slug || !form.description || !form.price) {
      toast.error("Заповніть назву, slug, опис і ціну");
      return;
    }
    const sizes = form.sizeList!
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean) as ProductSize[];
    const color: ProductColor = {
      id: form.colorName!.toLowerCase().replace(/\s+/g, "-"),
      name: form.colorName!,
      hex: form.colorHex!,
    };
    const existing = editId ? products.find((p) => p.id === editId) : null;
    const colors = existing?.colors?.length
      ? existing.colors.some((c) => c.id === color.id)
        ? existing.colors
        : [...existing.colors, color]
      : [color];
    const inventory: Record<string, number> = { ...(existing?.inventory ?? {}) };
    for (const c of colors) {
      for (const s of sizes) {
        const key = `${c.id}:${s}`;
        if (inventory[key] == null) inventory[key] = 5;
      }
    }

    const product: Product = {
      id: editId ?? `p-${Date.now()}`,
      slug: form.slug!,
      name: form.name!,
      category: (form.category as Category) ?? "sweaters",
      description: form.description!,
      details: form.details?.length ? form.details : ["Зроблено в Україні"],
      price: Number(form.price),
      salePrice: form.salePrice ? Number(form.salePrice) : undefined,
      colors,
      sizes,
      inventory,
      images: existing?.images ?? ["/products/shevchenko-1.svg"],
      figure: form.figure || undefined,
      featured: Boolean(form.featured),
      tags: form.tags ?? [],
      sizeChart: existing?.sizeChart,
    };
    upsertProduct(product);
    toast.success(editId ? "Товар оновлено" : "Товар додано");
    setEditId(null);
    setForm(emptyForm());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Адмін</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Демо-панель без пароля. Потік замовлення: оформлено → оплачено (після checkout) →
            в обробці → відправлено → доставлено. Залишки зменшуються автоматично при оплаті.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            resetDemo();
            toast.success("Демо-дані скинуто");
          }}
        >
          Скинути демо
        </Button>
      </div>

      <Tabs defaultValue="orders" className="mt-10">
        <TabsList>
          <TabsTrigger value="orders">Замовлення ({orders.length})</TabsTrigger>
          <TabsTrigger value="products">Товари ({products.length})</TabsTrigger>
          <TabsTrigger value="inventory">Склад</TabsTrigger>
          <TabsTrigger value="tickets">Тікети ({tickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6 space-y-4">
          {sortedOrders.length === 0 ? (
            <p className="text-muted-foreground">
              Поки немає замовлень. Оформіть покупку в магазині — вона з’явиться тут зі статусом
              «Оплачено».
            </p>
          ) : (
            sortedOrders.map((o) => (
              <article key={o.id} className="border border-border bg-mist/40 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{o.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString("uk-UA")} · {o.customer.name} ·{" "}
                      {o.customer.email}
                    </p>
                    <p className="mt-1 text-sm">{formatUAH(o.total)}</p>
                  </div>
                  <Select
                    value={o.status}
                    onValueChange={(v) => updateOrderStatus(o.id, v as OrderStatus)}
                    items={ORDER_STATUS_LABELS}
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
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
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {o.items.map((i) => (
                    <li key={`${i.productId}-${i.size}-${i.colorId}`}>
                      {i.name} · {i.colorName} · {i.size} × {i.qty}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </TabsContent>

        <TabsContent value="products" className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex gap-3 border border-border p-3"
              >
                <div className="relative size-16 shrink-0 overflow-hidden bg-mist">
                  <Image src={p.images[0]} alt="" fill className="object-cover" sizes="64px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORY_LABELS[p.category]} · {formatUAH(p.salePrice ?? p.price)} · склад{" "}
                    {totalStock(p.inventory)}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                      Редагувати
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteProduct(p.id);
                        toast.success("Видалено");
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit space-y-3 border border-border bg-mist/50 p-4">
            <h2 className="font-display text-lg font-semibold">
              {editId ? "Редагувати товар" : "Новий товар"}
            </h2>
            <div className="space-y-2">
              <Label>Назва</Label>
              <Input
                value={form.name ?? ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                value={form.slug ?? ""}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="sveter-nazva"
              />
            </div>
            <div className="space-y-2">
              <Label>Категорія</Label>
              <Select
                value={(form.category as string) ?? "sweaters"}
                onValueChange={(v) => setForm({ ...form, category: v as Category })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sweaters">Светри</SelectItem>
                  <SelectItem value="tshirts">Футболки</SelectItem>
                  <SelectItem value="scarves">Шарфи</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Опис</Label>
              <Textarea
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Ціна</Label>
                <Input
                  type="number"
                  value={form.price ?? 0}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sale ціна</Label>
                <Input
                  type="number"
                  value={form.salePrice ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      salePrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Постать / фігура</Label>
              <Input
                value={form.figure ?? ""}
                onChange={(e) => setForm({ ...form, figure: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Колір</Label>
                <Input
                  value={form.colorName}
                  onChange={(e) => setForm({ ...form, colorName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>HEX</Label>
                <Input
                  value={form.colorHex}
                  onChange={(e) => setForm({ ...form, colorHex: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Розміри (через кому)</Label>
              <Input
                value={form.sizeList}
                onChange={(e) => setForm({ ...form, sizeList: e.target.value })}
              />
            </div>
            <Button onClick={saveProduct} className="w-full">
              <Plus className="size-4" />
              {editId ? "Зберегти" : "Додати"}
            </Button>
            {editId && (
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setEditId(null);
                  setForm(emptyForm());
                }}
              >
                Скасувати
              </Button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="mt-6 space-y-6">
          {products.map((p) => (
            <div key={p.id} className="border border-border p-4">
              <p className="font-medium">{p.name}</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-3">Колір</th>
                      {p.sizes.map((s) => (
                        <th key={s} className="px-2 py-2">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.colors.map((c) => (
                      <tr key={c.id} className="border-b border-border/50">
                        <td className="py-2 pr-3">
                          <span
                            className="mr-2 inline-block size-3 rounded-full"
                            style={{ backgroundColor: c.hex }}
                          />
                          {c.name}
                        </td>
                        {p.sizes.map((s) => {
                          const key = `${c.id}:${s}`;
                          return (
                            <td key={key} className="px-2 py-2">
                              <Input
                                type="number"
                                className="h-8 w-16"
                                value={p.inventory[key] ?? 0}
                                onChange={(e) =>
                                  setInventory(p.id, key, Number(e.target.value))
                                }
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
          ))}
          <p className="text-xs text-muted-foreground">
            Доступні розміри для нових SKU: {SIZES.join(", ")}.
          </p>
        </TabsContent>

        <TabsContent value="tickets" className="mt-6 space-y-3">
          {tickets.length === 0 ? (
            <p className="text-muted-foreground">
              Тікетів немає. Нерозпізнані питання з чату підтримки з’являться тут.
            </p>
          ) : (
            tickets.map((t) => (
              <div key={t.id} className="border border-border p-4 text-sm">
                <p className="font-medium">
                  {t.id} · {t.email} · {t.status}
                  {t.telegramSent ? " · Telegram ✓" : " · Telegram mock"}
                </p>
                <p className="mt-2 text-muted-foreground">{t.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(t.createdAt).toLocaleString("uk-UA")}
                </p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
