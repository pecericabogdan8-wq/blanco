"use client";
import { Link, useRouter } from "@/i18n/navigation";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeCartOnLogin } from "@/lib/cart-actions";
import {
  FIELD_MSG,
  isBlank,
  isValidEmail,
  type FieldErrors,
} from "@/lib/form-field";
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
  const [errors, setErrors] = useState<FieldErrors>({});

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (isBlank(email)) next.email = FIELD_MSG.required;
    else if (!isValidEmail(email)) next.email = FIELD_MSG.email;
    if (isBlank(password)) next.password = FIELD_MSG.required;
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

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
      const nextPath = params.get("next") || "/account";
      if (nextPath.startsWith("/admin")) {
        window.location.href = nextPath;
        return;
      }
      router.push(nextPath);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">{t("loginTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("demoHint")}</p>
      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            aria-invalid={Boolean(errors.email)}
          />
          <FieldError message={errors.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError("password");
            }}
            aria-invalid={Boolean(errors.password)}
          />
          <FieldError message={errors.password} />
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
