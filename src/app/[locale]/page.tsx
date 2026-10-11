"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { HomeProductRail } from "@/components/shop/home-product-rail";
import { sortHomeRailProducts } from "@/lib/home-rail-sort";
import type { Product } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

type Mention = {
  id: string;
  handle: string;
  caption: string;
  image: string;
};

const LOOK = {
  hero: "/products/galleries/lookbook/08.jpg",
  bottom: "/products/galleries/lookbook/home-bottom.jpg",
  sweaters: "/products/galleries/lookbook/home-sweaters.jpg",
  tshirts: "/products/galleries/lookbook/home-tshirts.jpg",
  scarves: "/products/galleries/lookbook/home-scarves.jpg",
} as const;

export default function HomePage() {
  const t = useTranslations("Home");
  const tCat = useTranslations("Categories");
  const tNav = useTranslations("Nav");
  const products = useShopStore((s) => s.products);
  const setProducts = useShopStore((s) => s.setProducts);
  const [salesTopIds, setSalesTopIds] = useState<string[]>([]);
  const [soldById, setSoldById] = useState<Record<string, number>>({});
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  const catalog = products.length > 0 ? products : localProducts;

  const railProducts = useMemo(
    () => sortHomeRailProducts(catalog, salesTopIds, soldById),
    [catalog, salesTopIds, soldById]
  );

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [bestRes, igRes, prodRes] = await Promise.all([
          fetch("/api/stats/bestsellers?limit=24"),
          fetch("/api/instagram"),
          fetch("/api/products"),
        ]);
        const data = await bestRes.json();
        const ig = await igRes.json();
        const pd = await prodRes.json();
        if (!cancelled && data.ok) {
          const ids = Array.isArray(data.salesTopIds)
            ? (data.salesTopIds as string[])
            : [];
          setSalesTopIds(ids);
          const sold: Record<string, number> = {};
          if (Array.isArray(data.products)) {
            for (const p of data.products as (Product & { soldQty?: number })[]) {
              if (p?.id) sold[p.id] = Number(p.soldQty) || 0;
            }
          }
          setSoldById(sold);
        }
        if (!cancelled && ig.ok && Array.isArray(ig.mentions)) {
          setMentions(ig.mentions);
        }
        if (!cancelled && pd.ok && Array.isArray(pd.products)) {
          setLocalProducts(pd.products);
          setProducts(pd.products);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setProducts]);

  const categories = [
    {
      href: "/catalog?category=sweaters" as const,
      key: "sweaters" as const,
      img: LOOK.sweaters,
      position: "object-[center_20%]",
    },
    {
      href: "/catalog?category=tshirts" as const,
      key: "tshirts" as const,
      img: LOOK.tshirts,
      position: "object-[center_22%]",
    },
    {
      href: "/catalog?category=scarves" as const,
      key: "scarves" as const,
      img: LOOK.scarves,
      position: "object-[center_18%]",
    },
  ];

  return (
    <div className="bg-[#f6f5f2]">
      <section className="relative isolate w-full overflow-hidden bg-[#1a1410]">
        {/* Fixed aspect like PDP stage — predictable crop across breakpoints */}
        <div className="relative mx-auto aspect-[3/4] w-full sm:aspect-[4/3] lg:aspect-[16/9]">
          <Image
            src={LOOK.hero}
            alt={t("editorialAlt")}
            fill
            priority
            quality={95}
            className="object-cover object-[center_22%]"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 flex items-center justify-center px-4 pt-14 pb-10 sm:px-6">
            <div className="reveal max-w-md text-center">
              <p className="font-script text-[clamp(3.25rem,12vw,6rem)] leading-[0.9] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.55),0_2px_28px_rgba(0,0,0,0.35)]">
                Blanco
              </p>
              <p className="mx-auto mt-4 max-w-sm text-[13px] leading-relaxed text-white/95 [text-shadow:0_1px_2px_rgba(0,0,0,0.6),0_2px_16px_rgba(0,0,0,0.35)] sm:mt-5 sm:text-[15px]">
                {t("tagline")}
              </p>
              <Link
                href="/catalog"
                className="mt-7 inline-flex min-h-11 items-center justify-center border border-white/80 bg-transparent px-9 text-[11px] tracking-[0.18em] text-white uppercase shadow-[0_2px_20px_rgba(0,0,0,0.25)] transition duration-200 hover:border-white hover:bg-white/10 sm:text-xs"
              >
                {t("toCatalog")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-white px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            {t("aboutTitle")}
          </p>
          <p className="mt-5 text-pretty text-[15px] leading-relaxed text-foreground/85 sm:text-lg sm:leading-relaxed">
            {t("aboutBody")}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 border-b border-border min-[520px]:grid-cols-3">
        {categories.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative aspect-[3/4] overflow-hidden bg-[#1a1410]"
          >
            <Image
              src={c.img}
              alt={tCat(c.key)}
              fill
              quality={95}
              className={cn(
                "home-lookbook object-cover transition duration-700 ease-out group-hover:scale-[1.03]",
                c.position
              )}
              sizes="(max-width:519px) 100vw, 33vw"
              unoptimized
            />
            <span className="absolute inset-x-0 bottom-5 text-center text-[11px] font-semibold tracking-[0.2em] text-white uppercase [text-shadow:0_1px_10px_rgba(0,0,0,0.65)] sm:text-xs">
              {tCat(c.key)}
            </span>
          </Link>
        ))}
      </section>

      <HomeProductRail
        title={t("selected")}
        hint={t("popularHint")}
        products={railProducts}
        bestsellerIds={salesTopIds}
      />

      {mentions.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-[13px] font-semibold tracking-[0.18em] uppercase sm:text-sm">
              Instagram
            </h2>
            <Link
              href="/reviews"
              className="hover-brand-text text-[11px] tracking-[0.16em] uppercase underline-offset-4 hover:underline"
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
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  sizes="25vw"
                />
                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-[#5c4033]/45" />
                <div className="absolute inset-0 flex flex-col justify-end p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">{m.handle}</p>
                  <p className="text-[11px] text-white/75">{m.caption}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Bottom lookbook */}
      <section className="relative isolate overflow-hidden bg-[#1a1410]">
        <div className="relative aspect-[3/4] w-full sm:aspect-[4/3] lg:aspect-[21/9]">
          <Image
            src={LOOK.bottom}
            alt={t("editorialAlt")}
            fill
            quality={95}
            className="home-lookbook object-cover object-[center_28%]"
            sizes="100vw"
            unoptimized
          />
        </div>
      </section>
    </div>
  );
}
