"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import { formatUAH } from "@/lib/format";
import { localizedProductName } from "@/lib/localize-product";
import type { Product } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { useShopStore } from "@/store/shop-store";

type Bestseller = Product & { soldQty?: number };
type Mention = {
  id: string;
  handle: string;
  caption: string;
  image: string;
};

export default function HomePage() {
  const t = useTranslations("Home");
  const tCat = useTranslations("Categories");
  const tNav = useTranslations("Nav");
  const products = useShopStore((s) => s.products);
  const [bestsellers, setBestsellers] = useState<Bestseller[]>([]);
  const [salesTopIds, setSalesTopIds] = useState<string[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [bestIdx, setBestIdx] = useState(0);
  const kuzma = products.find((p) => p.id === "p-kuzma");
  const scarf = products.find((p) => p.id === "p-volya-scarf");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [bestRes, igRes] = await Promise.all([
          fetch("/api/stats/bestsellers?limit=8"),
          fetch("/api/instagram"),
        ]);
        const data = await bestRes.json();
        const ig = await igRes.json();
        if (!cancelled && data.ok) {
          setBestsellers(data.products ?? []);
          setSalesTopIds(
            Array.isArray(data.salesTopIds) ? data.salesTopIds : []
          );
        }
        if (!cancelled && ig.ok && Array.isArray(ig.mentions)) {
          setMentions(ig.mentions);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = [
    {
      href: "/catalog?category=sweaters" as const,
      key: "sweaters" as const,
      img: "/products/galleries/lesya/01.jpg",
    },
    {
      href: "/catalog?category=tshirts" as const,
      key: "tshirts" as const,
      img: "/products/galleries/kuzma-tee/01.jpg",
    },
    {
      href: "/catalog?category=scarves" as const,
      key: "scarves" as const,
      img: "/products/galleries/freedom-scarf/01.jpg",
    },
  ];

  return (
    <div>
      <section className="relative isolate min-h-[100svh] overflow-hidden bg-ink">
        <Image
          src="/products/hero-main.webp"
          alt="blanco lookbook"
          fill
          priority
          quality={95}
          className="object-cover object-[12%_18%] max-sm:object-[38%_24%]"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-transparent" />
        <div className="absolute inset-y-0 left-0 w-full max-w-md bg-gradient-to-r from-black/70 via-black/40 to-transparent sm:max-w-[45%] sm:from-black/60 sm:via-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/55 to-transparent sm:hidden" />

        {/* BlancoPortfolio hero: centered script mark + bottom CTA */}
        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-center px-4 pt-20 pb-16 sm:px-8 lg:px-12">
          <div className="reveal text-center">
            <p className="font-script text-[clamp(3.25rem,12vw,6.5rem)] leading-[0.9] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]">
              Blanco
            </p>
            <p className="mx-auto mt-4 max-w-sm text-[13px] leading-relaxed text-white/88 sm:mt-5 sm:text-[15px]">
              {t("tagline")}
            </p>
            <Link
              href="/catalog"
              className="mt-7 inline-flex min-h-11 items-center justify-center border border-white/45 bg-black/35 px-8 text-[11px] tracking-[0.16em] text-white uppercase backdrop-blur-sm transition hover:border-white/65 hover:bg-black/50 sm:mt-8 sm:text-xs"
            >
              {t("toCatalog")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 border-b border-border min-[480px]:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative aspect-[16/9] overflow-hidden bg-ink min-[480px]:aspect-[4/5] sm:aspect-[16/10]"
          >
            <Image
              src={c.img}
              alt={tCat(c.key)}
              fill
              quality={90}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width:479px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/35" />
            <span className="absolute inset-x-0 bottom-4 text-center text-xs font-semibold tracking-[0.16em] text-white uppercase sm:text-sm sm:tracking-[0.2em]">
              {tCat(c.key)}
            </span>
          </Link>
        ))}
      </section>

      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight uppercase sm:text-2xl">
                {t("popular")}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("popularHint")}
              </p>
            </div>
            {bestsellers.length > 4 && (
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label={t("prev")}
                  className="border border-border p-2 hover:bg-white"
                  onClick={() => setBestIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label={t("next")}
                  className="border border-border p-2 hover:bg-white"
                  onClick={() =>
                    setBestIdx((i) =>
                      Math.min(Math.max(0, bestsellers.length - 2), i + 1)
                    )
                  }
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {bestsellers.slice(bestIdx, bestIdx + 4).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                bestsellerIds={salesTopIds}
              />
            ))}
          </div>
        </section>
      )}

      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[70vh] bg-ink">
          <Image
            src="/products/hero-alt.webp"
            alt="blanco editorial"
            fill
            quality={95}
            className="object-cover"
            sizes="50vw"
          />
        </div>
        <div className="flex flex-col justify-center gap-10 bg-white px-6 py-14 sm:px-12 lg:px-16">
          {[kuzma, scarf].filter(Boolean).map((p) => (
            <Link
              key={p!.id}
              href={`/product/${p!.slug}`}
              className="group block max-w-sm"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f0eee9]">
                <Image
                  src={p!.images[0]}
                  alt={localizedProductName(p!)}
                  fill
                  quality={95}
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width:1024px) 100vw, 28vw"
                />
              </div>
              <p className="mt-4 text-sm font-semibold tracking-wide uppercase">
                {localizedProductName(p!)}
              </p>
              <p className="mt-1 flex flex-wrap items-baseline gap-2 text-sm font-semibold">
                <span
                  className={
                    p!.salePrice != null && p!.salePrice < p!.price
                      ? "text-[#c41e3a]"
                      : "text-foreground"
                  }
                >
                  {formatUAH(p!.salePrice ?? p!.price)}
                </span>
                {p!.salePrice != null && p!.salePrice < p!.price && (
                  <span className="font-normal text-muted-foreground line-through">
                    {formatUAH(p!.price)}
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="relative min-h-[55vh] overflow-hidden bg-ink">
        <Image
          src="/products/hero-field.webp"
          alt="blanco field lookbook"
          fill
          quality={95}
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 flex min-h-[55vh] items-end px-6 pb-10 sm:px-10">
          <div>
            <p className="font-script text-5xl text-white sm:text-6xl">
              Blanco
            </p>
            <p className="mt-2 max-w-sm text-sm text-white/75">{t("tagline")}</p>
          </div>
        </div>
      </section>

      {mentions.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="text-xl font-bold tracking-tight uppercase sm:text-2xl">
              Instagram
            </h2>
            <Link
              href="/reviews"
              className="text-xs tracking-[0.18em] uppercase underline-offset-4 hover:underline"
            >
              {tNav("reviews")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
            {mentions.map((m) => (
              <a
                key={m.id}
                href="https://www.instagram.com/blancoone/"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square overflow-hidden bg-[#eceae6]"
              >
                <Image
                  src={m.image}
                  alt={m.handle}
                  fill
                  quality={90}
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
                <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">{m.handle}</p>
                  <p className="text-[11px] text-white/75">{m.caption}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
