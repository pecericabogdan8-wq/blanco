"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORDER_STATUS_LABELS } from "@/lib/demo-data";
import { formatUAH } from "@/lib/format";
import { useShopStore } from "@/store/shop-store";

export default function AccountPage() {
  const router = useRouter();
  const user = useShopStore((s) => s.user);
  const orders = useShopStore((s) => s.orders);
  const logout = useShopStore((s) => s.logout);
  const updateProfile = useShopStore((s) => s.updateProfile);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">Кабінет</h1>
        <p className="mt-2 text-muted-foreground">Увійдіть, щоб бачити профіль і замовлення</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/auth/login" />}>Увійти</Button>
          <Button variant="outline" render={<Link href="/auth/register" />}>Реєстрація</Button>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter((o) => o.userId === user.id || o.customer.email === user.email);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Привіт, {user.name}</h1>
          <p className="mt-1 text-muted-foreground">{user.email}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            logout();
            toast.success("Вийшли");
            router.push("/");
          }}
        >
          Вийти
        </Button>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <section className="space-y-4 border border-border bg-mist/40 p-6">
          <h2 className="font-display text-xl font-semibold">Профіль</h2>
          <div className="space-y-2">
            <Label>Ім’я</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Телефон</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button
            onClick={() => {
              updateProfile({ name, phone });
              toast.success("Збережено");
            }}
          >
            Зберегти
          </Button>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold">Замовлення</h2>
          {myOrders.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Ще немає замовлень</p>
          ) : (
            <ul className="mt-4 divide-y divide-border border border-border">
              {myOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-4 hover:bg-mist/50"
                  >
                    <div>
                      <p className="font-medium">{o.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.createdAt).toLocaleString("uk-UA")} ·{" "}
                        {ORDER_STATUS_LABELS[o.status]}
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
