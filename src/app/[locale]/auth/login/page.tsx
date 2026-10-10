"use client";
import { Link, useRouter } from "@/i18n/navigation";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeCartOnLogin } from "@/lib/cart-actions";
import { useShopStore } from "@/store/shop-store";

function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const params = useSearchParams();
  const setUser = useShopStore((s) => s.setUser);
  const setWishlist = useShopStore((s) => s.setWishlist);
  const [email, setEmail] = useState("demo@blanco.ua");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? t("loginError"));
        return;
      }
      setUser(data.user);
      const [wish] = await Promise.all([
        fetch("/api/wishlist"),
        mergeCartOnLogin(),
      ]);
      const wishData = await wish.json();
      if (wishData.ok) setWishlist(wishData.productIds);
      toast.success(t("welcome"));
      const next = params.get("next") || "/account";
      // Admin lives outside locale prefixes — i18n router would make /en/admin → 404
      if (next.startsWith("/admin")) {
        window.location.href = next;
        return;
      }
      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("demoHint")}</p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "…" : t("login")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="underline">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
