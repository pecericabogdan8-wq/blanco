"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { ProductCard } from "@/components/shop/product-card";
import { DEMO_MENTIONS } from "@/lib/demo-data";
import { formatUAH } from "@/lib/format";
import { useShopStore } from "@/store/shop-store";

export default function HomePage() {
  const products = useShopStore((s) => s.products);
  const featured = useMemo(
    () => products.filter((p) => p.featured).slice(0, 4),
    [products]
  );
  const kuzma = products.find((p) => p.id === "p-kuzma");
  const scarf = products.find((p) => p.id === "p-volya-scarf");

  return (
    <div>
      {/* Full-bleed hero — brand first, portfolio style */}
      <section className="relative min-h-[100svh] overflow-hidden bg-ink">
        <Image
          src="/products/hero-main.webp"
          alt="blanco lookbook"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-black/25" />

        <div className="relative z-10 flex min-h-[100svh] flex-col items-center justify-end px-4 pb-16 sm:pb-20">
          <p className="reveal font-display text-[clamp(4.5rem,16vw,9rem)] leading-none text-white">
            Blanco
          </p>
          <p className="reveal reveal-delay-1 mt-4 max-w-md text-center text-sm text-white/75 sm:text-base">
            Memory on the chest. Knitted in Ukraine.
          </p>
          <Link
            href="/catalog"
            className="reveal reveal-delay-2 glass-cta mt-8 px-8 py-3 text-xs tracking-[0.22em] text-white uppercase transition hover:bg-white/28"
          >
            Shop now
          </Link>
        </div>
      </section>

      {/* Editorial split + two products — like portfolio */}
      <section className="grid lg:grid-cols-2">
        <div className="relative min-h-[70vh] bg-ink">
          <Image
            src="/products/hero-alt.webp"
            alt="blanco editorial"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
        <div className="flex flex-col justify-center gap-10 bg-white px-6 py-14 sm:px-12 lg:px-16">
          {[kuzma, scarf].filter(Boolean).map((p) => (
            <Link key={p!.id} href={`/product/${p!.slug}`} className="group block max-w-sm">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f0eee9]">
                <Image
                  src={p!.images[0]}
                  alt={p!.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width:1024px) 100vw, 28vw"
                />
              </div>
              <p className="mt-4 text-sm tracking-wide">{p!.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatUAH(p!.salePrice ?? p!.price)}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Selected products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex items-end justify-between gap-4">
          <h2 className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
            Selected products
          </h2>
          <Link href="/catalog" className="text-xs tracking-[0.18em] uppercase underline-offset-4 hover:underline">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Field lookbook strip */}
      <section className="relative min-h-[55vh] overflow-hidden bg-ink">
        <Image
          src="/products/hero-field.webp"
          alt="blanco field lookbook"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative z-10 flex min-h-[55vh] items-end px-6 pb-10 sm:px-10">
          <div>
            <p className="font-display text-5xl text-white sm:text-6xl">Blanco</p>
            <p className="mt-2 max-w-sm text-sm text-white/75">
              Warm, grounded, intentional — the collection frames history without competing with it.
            </p>
          </div>
        </div>
      </section>

      {/* Mentions */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-xs tracking-[0.28em] text-muted-foreground uppercase">In the feed</h2>
          <Link href="/reviews" className="text-xs tracking-[0.18em] uppercase underline-offset-4 hover:underline">
            Reviews
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
          {DEMO_MENTIONS.map((m) => (
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
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="25vw"
              />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
