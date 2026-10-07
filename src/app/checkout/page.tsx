"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatUAH } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

export default function CheckoutPage() {
  const router = useRouter();
  const products = useShopStore((s) => s.products);
  const cart = useShopStore((s) => s.cart);
  const user = useShopStore((s) => s.user);
  const placeOrder = useShopStore((s) => s.placeOrder);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: "Київ",
    address: "",
    novaPoshta: "",
    card: "",
    exp: "",
    cvc: "",
  });

  const lines = useMemo(
    () =>
      cart.flatMap((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return [];
        return [{ item, product, price: product.salePrice ?? product.price }];
      }),
    [cart, products]
  );

  const subtotal = lines.reduce((s, l) => s + l.price * l.item.qty, 0);
  const shipping = subtotal >= 2500 || subtotal === 0 ? 0 : 99;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Немає що оформлювати</h1>
        <Button className="mt-6" render={<Link href="/catalog" />}>До каталогу</Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.city || !form.address) {
      toast.error("Заповніть усі обов’язкові поля");
      return;
    }
    if (method === "card" && (!form.card || !form.exp || !form.cvc)) {
      toast.error("Введіть дані картки (демо)");
      return;
    }

    setLoading(true);
    try {
      const pay = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, method }),
      });
      const payData = await pay.json();
      if (!payData.ok) {
        toast.error("Оплата не пройшла");
        return;
      }

      const res = placeOrder({
        paymentMethod: method,
        customer: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          address: form.address,
          novaPoshta: form.novaPoshta || undefined,
        },
      });

      if (!res.ok || !res.order) {
        toast.error(res.error ?? "Помилка замовлення");
        return;
      }

      toast.success(`Замовлення ${res.order.id} оплачено`);
      router.push(`/account/orders/${res.order.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">Оформлення</h1>
      <form onSubmit={onSubmit} className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Контакти та доставка</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Ім’я *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+380…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Місто *</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">Відділення НП</Label>
                <Input
                  id="np"
                  value={form.novaPoshta}
                  onChange={(e) => setForm({ ...form, novaPoshta: e.target.value })}
                  placeholder="№ відділення"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">Адреса *</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Оплата</h2>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="card" />
                <span>Картка Visa / Mastercard</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="apple_pay" />
                <span>Apple Pay</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="google_pay" />
                <span>Google Pay</span>
              </label>
            </RadioGroup>

            {method === "card" && (
              <div className="grid gap-3 rounded-md border border-dashed border-border bg-mist/40 p-4 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-3">
                  <Label>Номер картки (демо)</Label>
                  <Input
                    placeholder="4242 4242 4242 4242"
                    value={form.card}
                    onChange={(e) => setForm({ ...form, card: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Термін</Label>
                  <Input
                    placeholder="12/28"
                    value={form.exp}
                    onChange={(e) => setForm({ ...form, exp: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>CVC</Label>
                  <Input
                    placeholder="123"
                    value={form.cvc}
                    onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  Демо-режим: гроші не списуються. Для Stripe test додайте STRIPE_SECRET_KEY у .env.
                </p>
              </div>
            )}

            {(method === "apple_pay" || method === "google_pay") && (
              <div className="rounded-md border border-border bg-ink p-4 text-center text-mist">
                <p className="font-medium">
                  {method === "apple_pay" ? " Pay" : "G Pay"} · демо
                </p>
                <p className="mt-1 text-xs text-mist/60">
                  Натисніть «Оплатити» — симулюємо успішну оплату гаманцем.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="h-fit border border-border bg-mist/60 p-6">
          <h2 className="font-display text-xl font-semibold">Замовлення</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map(({ item, product, price }) => (
              <li key={`${item.productId}-${item.size}-${item.colorId}`} className="flex justify-between gap-2">
                <span className="text-muted-foreground">
                  {product.name} × {item.qty}
                </span>
                <span>{formatUAH(price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Доставка</span>
              <span>{shipping === 0 ? "0 ₴" : formatUAH(shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-medium">
              <span>Разом</span>
              <span>{formatUAH(total)}</span>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? "Обробка…" : `Оплатити ${formatUAH(total)}`}
          </Button>
        </aside>
      </form>
    </div>
  );
}
