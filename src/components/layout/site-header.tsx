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
  { href: "/catalog", label: "Shop" },
  { href: "/reviews", label: "About" },
  { href: "/returns", label: "Contacts" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const cartCount = useCartCount();
  const wishCount = useWishlistCount();
  const user = useShopStore((s) => s.user);
  const isHome = pathname === "/";

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    router.push(query ? `/catalog?q=${encodeURIComponent(query)}` : "/catalog");
    setOpen(false);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors",
        isHome
          ? "absolute inset-x-0 border-transparent bg-transparent text-white"
          : "border-b border-border/80 bg-[#f6f5f2]/90 text-foreground backdrop-blur-md"
      )}
    >
      <div className="relative mx-auto grid h-16 max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:h-[4.5rem] sm:px-6">
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[12px] tracking-[0.14em] uppercase transition-opacity hover:opacity-70",
                pathname.startsWith(item.href) && "opacity-100",
                isHome ? "text-white/90" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="pressable justify-self-start lg:hidden"
          aria-label="Меню"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link
          href="/"
          className="font-display justify-self-center text-[2.35rem] leading-none tracking-normal sm:text-[2.75rem]"
        >
          Blanco
        </Link>

        <div className="flex items-center justify-end gap-0.5">
          <form onSubmit={onSearch} className="mr-1 hidden max-w-[10rem] md:block">
            <div className="relative">
              <Search
                className={cn(
                  "pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2",
                  isHome ? "text-white/70" : "text-muted-foreground"
                )}
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search"
                className={cn(
                  "h-8 border-0 bg-transparent pl-8 text-xs shadow-none focus-visible:ring-0",
                  isHome
                    ? "text-white placeholder:text-white/55"
                    : "placeholder:text-muted-foreground"
                )}
                aria-label="Пошук товарів"
              />
            </div>
          </form>
          <Button
            variant="ghost"
            size="icon"
            className={cn("relative", isHome && "text-white hover:bg-white/10 hover:text-white")}
            render={<Link href="/wishlist" aria-label="Wishlist" />}
          >
            <Heart className="size-5" />
            {wishCount > 0 && (
              <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                {wishCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn("relative", isHome && "text-white hover:bg-white/10 hover:text-white")}
            render={<Link href="/cart" aria-label="Кошик" />}
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(isHome && "text-white hover:bg-white/10 hover:text-white")}
            render={<Link href={user ? "/account" : "/auth/login"} aria-label="Акаунт" />}
          >
            <User className="size-5" />
          </Button>
        </div>
      </div>

      {open && (
        <div
          className={cn(
            "border-t px-4 py-5 lg:hidden",
            isHome ? "border-white/15 bg-black/80 text-white" : "border-border bg-white"
          )}
        >
          <form onSubmit={onSearch} className="mb-4">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="rounded-none"
            />
          </form>
          <nav className="flex flex-col gap-3.5">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.14em] uppercase"
              >
                {item.label}
              </Link>
            ))}
            <Link href="/sale" onClick={() => setOpen(false)} className="text-sm tracking-[0.14em] uppercase opacity-70">
              Sale
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
