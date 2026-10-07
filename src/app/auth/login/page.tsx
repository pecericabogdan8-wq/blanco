"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopStore } from "@/store/shop-store";

export default function LoginPage() {
  const router = useRouter();
  const login = useShopStore((s) => s.login);
  const [email, setEmail] = useState("demo@blanco.ua");
  const [password, setPassword] = useState("demo1234");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = login(email, password);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Вітаємо!");
    router.push("/account");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Вхід</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Демо: demo@blanco.ua / demo1234
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" size="lg">
          Увійти
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Немає акаунту?{" "}
        <Link href="/auth/register" className="text-foreground underline">
          Реєстрація
        </Link>
      </p>
    </div>
  );
}
