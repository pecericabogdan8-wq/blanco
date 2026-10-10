"use client";
import { Link, useRouter } from "@/i18n/navigation";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useShopStore } from "@/store/shop-store";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const setUser = useShopStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? t("registerError"));
        return;
      }
      setUser(data.user);
      toast.success(t("accountCreated"));
      router.push("/account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold">{t("registerTitle")}</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            minLength={6}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "…" : t("createAccount")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("hasAccount")}{" "}
        <Link href="/auth/login" className="underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
