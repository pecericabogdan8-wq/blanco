"use client";

import { Heart, Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BlancoLogo } from "@/components/brand/blanco-logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Button } from "@/components/ui/button";
import { HydratedGate } from "@/components/shop/hydrated-gate";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  localizedProductName,
  productMatchesQuery,
} from "@/lib/localize-product";
import type { Product } from "@/lib/types";
import { useCartCount, useShopStore, useWishlistCount } from "@/store/shop-store";
import { cn } from "@/lib/utils";
import { formatUAH, productPrice } from "@/lib/format";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-[#c41e3a] text-[9px] text-white">
      {count}
    </span>
  );
}

function HeaderSearch({ isHome }: { isHome: boolean }) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const storeProducts = useShopStore((s) => s.products);
  const setProducts = useShopStore((s) => s.setProducts);
  const urlQ = pathname.startsWith("/catalog")
    ? (searchParams.get("q") ?? "")
    : "";
  const [q, setQ] = useState(urlQ);
  const [open, setOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState(urlQ);

  useEffect(() => {
    setQ(urlQ);
    setDebouncedQ(urlQ);
  }, [urlQ]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 180);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!open || storeProducts.length > 0) return;
    let cancelled = false;
    void fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.ok || !Array.isArray(d.products)) return;
        setProducts(d.products as Product[]);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [open, storeProducts.length, setProducts]);

  const suggestions = useMemo(() => {
    const needle = debouncedQ.trim();
    if (needle.length < 1) return [];
    return storeProducts
      .filter((p) => productMatchesQuery(p, needle))
      .slice(0, 6);
  }, [storeProducts, debouncedQ]);

  const showSuggestions = open && debouncedQ.trim().length >= 1;

  function goSearch(query: string) {
    const trimmed = query.trim();
    setOpen(false);
    router.push(
      trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog"
    );
  }

  function goProduct(slug: string) {
    setOpen(false);
    setQ("");
    setDebouncedQ("");
    router.push(`/product/${slug}`);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="nav-icon shrink-0 hover:bg-transparent aria-expanded:bg-transparent"
        aria-label={t("openSearch")}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="size-5" /> : <Search className="size-5" />}
      </Button>

      {open ? (
        <>
          {/* Backdrop — click closes */}
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="fixed inset-0 z-40 bg-black/25"
            onClick={() => setOpen(false)}
          />
          {/* Full-width panel (not clipped to icon column) */}
          <div
            className={cn(
              "fixed inset-x-0 top-14 z-50 border-b shadow-lg sm:top-16",
              isHome
                ? "border-white/10 bg-ink/95 text-white backdrop-blur-md"
                : "border-border bg-[#f6f5f2] text-foreground"
            )}
          >
            <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 sm:py-5">
              <form
                role="search"
                onSubmit={(e) => {
                  e.preventDefault();
                  goSearch(q);
                }}
                className="relative"
              >
                <Search
                  className={cn(
                    "pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2",
                    isHome ? "text-white/55" : "text-muted-foreground"
                  )}
                />
                <input
                  autoFocus
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("search")}
                  enterKeyHint="search"
                  autoComplete="off"
                  className={cn(
                    "h-12 w-full border pr-11 pl-11 text-base outline-none sm:h-12",
                    isHome
                      ? "border-white/20 bg-white/10 text-white placeholder:text-white/50 focus:border-white/40"
                      : "border-border bg-white text-foreground focus:border-ink"
                  )}
                  aria-label={t("search")}
                  aria-autocomplete="list"
                />
                {q.trim() ? (
                  <button
                    type="button"
                    aria-label={t("clearSearch")}
                    onClick={() => {
                      setQ("");
                      setDebouncedQ("");
                    }}
                    className={cn(
                      "absolute top-1/2 right-2.5 z-10 flex size-8 -translate-y-1/2 items-center justify-center",
                      isHome
                        ? "text-white/80 hover-brand-text-on-dark"
                        : "text-foreground hover-brand-text"
                    )}
                  >
                    <X className="size-4 stroke-[2.5]" />
                  </button>
                ) : null}
              </form>

              {showSuggestions ? (
                <div
                  className={cn(
                    "mt-3 overflow-hidden border",
                    isHome
                      ? "border-white/15 bg-ink"
                      : "border-border bg-white"
                  )}
                >
                  {suggestions.length === 0 ? (
                    <p
                      className={cn(
                        "px-4 py-4 text-sm",
                        isHome ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {t("searchNoResults")}
                    </p>
                  ) : (
                    <ul>
                      {suggestions.map((p) => {
                        const { current } = productPrice(p.price, p.salePrice);
                        const img = p.images[0];
                        return (
                          <li key={p.id} className="border-b border-border/60 last:border-0">
                            <button
                              type="button"
                              onClick={() => goProduct(p.slug)}
                              className={cn(
                                "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
                                isHome
                                  ? "border-white/10 hover:bg-white/10"
                                  : "hover:bg-[#f6f5f2]"
                              )}
                            >
                              <span className="relative size-14 shrink-0 overflow-hidden bg-muted sm:size-16">
                                {img ? (
                                  <Image
                                    src={img}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                ) : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium sm:text-[15px]">
                                  {localizedProductName(p)}
                                </span>
                                <span
                                  className={cn(
                                    "mt-0.5 block text-sm",
                                    isHome
                                      ? "text-white/55"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {formatUAH(current)}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => goSearch(q)}
                    className={cn(
                      "flex w-full items-center justify-center border-t px-4 py-3 text-[11px] tracking-[0.14em] uppercase transition-colors",
                      isHome
                        ? "border-white/10 text-white/80 hover:bg-white/10"
                        : "border-border text-foreground/70 hover:bg-[#f6f5f2]"
                    )}
                  >
                    {t("searchSeeAll")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

export function SiteHeader() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const cartCount = useCartCount();
  const wishCount = useWishlistCount();
  const user = useShopStore((s) => s.user);
  const isHome = pathname === "/";

  const mainNav = [
    { href: "/catalog" as const, label: t("catalog") },
    { href: "/sale" as const, label: t("sale") },
    { href: "/reviews" as const, label: t("reviews") },
    { href: "/returns" as const, label: t("delivery") },
  ];

  return (
    <header
      className={cn(
        "relative z-50 w-full transition-colors duration-200",
        isHome
          ? "nav-on-dark border-transparent bg-transparent text-white"
          : "border-b border-border/80 bg-[#f6f5f2]/95 text-foreground backdrop-blur-md"
      )}
    >
      {isHome ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/18 to-transparent"
        />
      ) : null}
      {/*
        Mobile/tablet: burger | mark | search+icons
        Desktop (lg+): nav links | mark | search+icons
        Never show both burger and desktop links at once.
      */}
      {/* Equal L/R inset: 1fr | logo | 1fr — same px as page/footer */}
      <div className="relative mx-auto grid h-14 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center justify-start">
          <div className="lg:hidden">
            <MobileNav items={mainNav} isHome={isHome} />
          </div>
          <nav className="hidden items-center gap-4 lg:flex xl:gap-6">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="nav-link cursor-pointer whitespace-nowrap text-[12px] font-medium tracking-[0.06em] uppercase xl:text-[13px]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link
          href="/"
          className="justify-self-center"
          aria-label={t("home")}
        >
          <BlancoLogo invert={isHome} markClassName="!size-7 sm:!size-8" />
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-0">
          <Suspense fallback={<div className="size-9 shrink-0" />}>
            <HeaderSearch isHome={isHome} />
          </Suspense>
          <Button
            variant="ghost"
            size="icon"
            className="nav-icon relative shrink-0 hover:bg-transparent"
            render={<Link href="/wishlist" aria-label={t("wishlist")} />}
          >
            <Heart className="size-5" />
            <HydratedGate>
              <CountBadge count={wishCount} />
            </HydratedGate>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="nav-icon relative shrink-0 hover:bg-transparent"
            render={<Link href="/cart" aria-label={t("cart")} />}
          >
            <ShoppingBag className="size-5" />
            <HydratedGate>
              <CountBadge count={cartCount} />
            </HydratedGate>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="nav-icon hidden shrink-0 min-[400px]:inline-flex hover:bg-transparent"
            render={
              <Link
                href={user ? "/account" : "/auth/login"}
                aria-label={t("account")}
              />
            }
          >
            <User className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
