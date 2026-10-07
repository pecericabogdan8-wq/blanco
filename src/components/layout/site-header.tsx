"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartCount, useShopStore, useWishlistCount } from "@/store/shop-store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/catalog", label: "Каталог" },
  { href: "/catalog?category=sweaters", label: "Светри" },
  { href: "/sale", label: "Sale" },
  { href: "/reviews", label: "Відгуки" },
  { href: "/returns", label: "Повернення" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const cartCount = useCartCount();
  const wishCount = useWishlistCount();
  const user = useShopStore((s) => s.user);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
    setOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-[#eceef1]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <button
          type="button"
          className="lg:hidden"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link
          href="/"
          className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
        >
          blanco
        </Link>

        <nav className="ml-6 hidden items-center gap-5 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm tracking-wide text-muted-foreground transition-colors hover:text-foreground",
                pathname === item.href && "text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={onSearch} className="ml-auto hidden max-w-xs flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук…"
              className="h-9 border-border/80 bg-mist/60 pl-9"
              aria-label="Пошук товарів"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <Button variant="ghost" size="icon" className="relative" render={<Link href="/wishlist" aria-label="Wishlist" />}>
              <Heart className="size-5" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {wishCount}
                </span>
              )}
          </Button>
          <Button variant="ghost" size="icon" className="relative" render={<Link href="/cart" aria-label="Кошик" />}>
              <ShoppingBag className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {cartCount}
                </span>
              )}
          </Button>
          <Button variant="ghost" size="icon" render={<Link href={user ? "/account" : "/auth/login"} aria-label="Акаунт" />}>
              <User className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-mist px-4 py-4 lg:hidden">
          <form onSubmit={onSearch} className="mb-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Пошук…"
                className="pl-9"
              />
            </div>
          </form>
          <nav className="flex flex-col gap-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/admin" onClick={() => setOpen(false)} className="text-sm text-muted-foreground">
              Адмін
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
