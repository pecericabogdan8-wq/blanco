"use client";
import { Link, useRouter } from "@/i18n/navigation";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HydratedGate } from "@/components/shop/hydrated-gate";
import {
  FIELD_MSG,
  isBlank,
  isValidEmail,
  type FieldErrors,
} from "@/lib/form-field";
import { formatUAH } from "@/lib/format";
import type { PaymentMethod } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

function CheckoutInner() {
  const t = useTranslations("Checkout");
  const router = useRouter();
  const products = useShopStore((s) => s.products);
  const cart = useShopStore((s) => s.cart);
  const user = useShopStore((s) => s.user);
  const clearCart = useShopStore((s) => s.clearCart);

  const [method, setMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    novaPoshta: "",
  });

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (isBlank(form.name)) next.name = FIELD_MSG.required;
    if (isBlank(form.email)) next.email = FIELD_MSG.required;
    else if (!isValidEmail(form.email)) next.email = FIELD_MSG.email;
    if (isBlank(form.phone)) next.phone = FIELD_MSG.required;
    if (isBlank(form.city)) next.city = FIELD_MSG.required;
    if (isBlank(form.address)) next.address = FIELD_MSG.required;
    return next;
  }

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      name: f.name || user.name,
      email: f.email || user.email,
      phone: f.phone || user.phone || "",
    }));
  }, [user]);

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

  if (cart.length === 0 || lines.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">{t("empty")}</h1>
        <Button className="mt-6" render={<Link href="/catalog" />}>
          {t("toCatalog")}
        </Button>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          cart: cart.map((c) => ({
            productId: c.productId,
            colorId: c.colorId,
            size: c.size,
            qty: c.qty,
          })),
          customer: form,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? t("orderError"));
        return;
      }

      clearCart();
      const productsRes = await fetch("/api/products");
      const productsData = await productsRes.json();
      if (productsData.ok) useShopStore.getState().setProducts(productsData.products);

      toast.success(t("orderPaid", { id: data.order.id }));
      router.push(`/account/orders/${data.order.id}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {t("title")}
      </h1>
      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 grid gap-8 lg:mt-10 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-10"
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="text-lg font-semibold sm:text-xl">{t("contacts")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                />
                <FieldError message={errors.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("phone")}</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder="+380…"
                  aria-invalid={Boolean(errors.phone)}
                />
                <FieldError message={errors.phone} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                />
                <FieldError message={errors.email} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">{t("city")}</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  aria-invalid={Boolean(errors.city)}
                />
                <FieldError message={errors.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="np">{t("np")}</Label>
                <Input
                  id="np"
                  value={form.novaPoshta}
                  onChange={(e) => setField("novaPoshta", e.target.value)}
                  placeholder={t("npPlaceholder")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">{t("address")}</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  aria-invalid={Boolean(errors.address)}
                />
                <FieldError message={errors.address} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-xl font-semibold">{t("payment")}</h2>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
              className="space-y-3"
            >
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="card" />
                <span>{t("card")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="apple_pay" />
                <span>{t("applePay")}</span>
              </label>
              <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
                <RadioGroupItem value="google_pay" />
                <span>{t("googlePay")}</span>
              </label>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">{t("paymentHint")}</p>
          </section>
        </div>

        <aside className="h-fit border border-border bg-mist/60 p-4 sm:p-6 lg:sticky lg:top-20">
          <h2 className="text-lg font-semibold sm:text-xl">{t("orderSummary")}</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {lines.map(({ item, product, price }) => (
              <li
                key={`${item.productId}-${item.size}-${item.colorId}`}
                className="flex justify-between gap-2"
              >
                <span className="text-muted-foreground">
                  {product.name} × {item.qty}
                </span>
                <span>{formatUAH(price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("shipping")}</span>
              <span>
                {shipping === 0 ? t("freeShipping") : formatUAH(shipping)}
              </span>
            </div>
            <div className="flex justify-between text-base font-medium">
              <span>{t("total")}</span>
              <span>{formatUAH(total)}</span>
            </div>
          </div>
          <Button type="submit" className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? t("processing") : t("pay", { amount: formatUAH(total) })}
          </Button>
        </aside>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  const t = useTranslations("Checkout");
  return (
    <HydratedGate
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">
          {t("loading")}
        </div>
      }
    >
      <CheckoutInner />
    </HydratedGate>
  );
}
