"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopStore } from "@/store/shop-store";

export default function RegisterPage() {
  const router = useRouter();
  const register = useShopStore((s) => s.register);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = register(name, email, password);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success("Акаунт створено");
    router.push("/account");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight">Реєстрація</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Ім’я</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
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
            minLength={6}
          />
        </div>
        <Button type="submit" className="w-full" size="lg">
          Створити акаунт
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Вже є акаунт?{" "}
        <Link href="/auth/login" className="text-foreground underline">
          Увійти
        </Link>
      </p>
    </div>
  );
}
