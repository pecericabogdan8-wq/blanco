"use client";
import { Link, useRouter } from "@/i18n/navigation";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUAH } from "@/lib/format";
import type { Order } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";

export default function AccountPage() {
  const t = useTranslations("Account");
  const tAuth = useTranslations("Auth");
  const tStatus = useTranslations("OrderStatus");
  const router = useRouter();
  const user = useShopStore((s) => s.user);
  const setUser = useShopStore((s) => s.setUser);
  const setWishlist = useShopStore((s) => s.setWishlist);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone ?? "");
      fetch("/api/orders")
        .then((r) => r.json())
        .then((d) => {
          if (d.ok) setOrders(d.orders);
        })
        .catch(() => undefined);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("loginPrompt")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/auth/login" />}>{tAuth("login")}</Button>
          <Button variant="outline" render={<Link href="/auth/register" />}>
            {tAuth("register")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            {t("hello", { name: user.name })}
          </h1>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
          {user.role === "ADMIN" && (
            <a
              href="/admin"
              className="mt-2 inline-block text-sm underline underline-offset-4"
            >
              {t("admin")}
            </a>
          )}
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            // Flush cart to account before session ends — next login restores it
            const cart = useShopStore.getState().cart;
            await fetch("/api/cart", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cart }),
            }).catch(() => undefined);
            await fetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            // Clear local guest state only after user=null so server cart is not wiped
            setWishlist([]);
            useShopStore.setState({ cart: [] });
            try {
              localStorage.setItem(
                "blanco-cart-v4",
                JSON.stringify({ cart: [], wishlist: [] })
              );
            } catch {
              /* ignore */
            }
            toast.success(t("loggedOut"));
            router.push("/");
          }}
        >
          {t("logout")}
        </Button>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="space-y-4 border border-border bg-mist/40 p-6">
          <h2 className="font-display text-xl font-semibold">{t("profile")}</h2>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t("phone")}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button
            onClick={async () => {
              const res = await fetch("/api/auth/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, phone }),
              });
              const data = await res.json();
              if (!data.ok) {
                toast.error(data.error ?? t("saveError"));
                return;
              }
              setUser(data.user);
              toast.success(t("saved"));
            }}
          >
            {t("save")}
          </Button>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">{t("orders")}</h2>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border border-border">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-mist/50"
                  >
                    <div>
                      <p className="font-medium">{o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString("uk-UA")}{" "}
                        · {tStatus(o.status as "placed")}
                      </p>
                    </div>
                    <span>{formatUAH(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
