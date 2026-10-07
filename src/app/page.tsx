"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { DEMO_MENTIONS } from "@/lib/demo-data";
import { useShopStore } from "@/store/shop-store";

export default function HomePage() {
  const products = useShopStore((s) => s.products);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div>
      {/* Full-bleed hero — brand first */}
      <section className="relative min-h-[100svh] overflow-hidden grain">
        <div className="absolute inset-0">
          <Image
            src="/products/shevchenko-1.svg"
            alt="blanco — светри з українськими діячами"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/25" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
          <p className="reveal font-display text-[clamp(4.5rem,18vw,11rem)] leading-[0.85] font-extrabold tracking-tighter text-mist">
            blanco
          </p>
          <h1 className="reveal reveal-delay-1 mt-4 max-w-xl text-balance text-xl text-mist/90 sm:text-2xl">
            Светри з обличчями тих, хто сформував Україну
          </h1>
          <p className="reveal reveal-delay-2 mt-3 max-w-md text-sm text-mist/65 sm:text-base">
            Історія — на грудях. Унісекс. Зроблено в Україні.
          </p>
          <div className="reveal reveal-delay-3 mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-mist text-ink hover:bg-mist/90" render={<Link href="/catalog" />}>
              Дивитись каталог
              <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-mist/40 bg-transparent text-mist hover:bg-mist/10 hover:text-mist"
              render={
                <a
                  href="https://www.instagram.com/blancoone/"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <InstagramIcon className="size-4" />
              @blancoone
            </Button>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="overflow-hidden border-y border-border/60 bg-mist/50 py-3">
        <div className="marquee flex w-max gap-10 whitespace-nowrap text-xs tracking-[0.25em] text-muted-foreground uppercase">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-10 px-5">
              <span>Шевченко</span>
              <span>Леся Українка</span>
              <span>Франко</span>
              <span>Сковорода</span>
              <span>Стус</span>
              <span>Бандера</span>
              <span>Светри · футболки · шарфи</span>
            </div>
          ))}
        </div>
      </div>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Вибране
            </h2>
            <p className="mt-2 text-muted-foreground">Портрети, які хочеться носити</p>
          </div>
          <Link
            href="/catalog"
            className="hidden text-sm underline-offset-4 hover:underline sm:inline"
          >
            Увесь каталог
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Categories strip */}
      <section className="border-y border-border/60 bg-ink text-mist">
        <div className="mx-auto grid max-w-7xl md:grid-cols-3">
          {[
            {
              href: "/catalog?category=sweaters",
              title: "Светри",
              text: "Головна лінія — портрети діячів",
              img: "/products/lesya-1.svg",
            },
            {
              href: "/catalog?category=tshirts",
              title: "Футболки",
              text: "База з характером",
              img: "/products/tee-trizub-1.svg",
            },
            {
              href: "/catalog?category=scarves",
              title: "Шарфи",
              text: "Теплий акцент зими",
              img: "/products/scarf-1.svg",
            },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative min-h-56 overflow-hidden border-b border-white/10 md:border-r md:border-b-0 md:last:border-r-0"
            >
              <Image
                src={c.img}
                alt={c.title}
                fill
                className="object-cover opacity-40 transition duration-700 group-hover:scale-105 group-hover:opacity-55"
                sizes="33vw"
              />
              <div className="relative z-10 flex h-full flex-col justify-end p-8">
                <h3 className="font-display text-3xl font-bold">{c.title}</h3>
                <p className="mt-1 text-sm text-mist/70">{c.text}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mentions teaser */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              У стрічці
            </h2>
            <p className="mt-2 text-muted-foreground">Відмітки з Instagram</p>
          </div>
          <Link href="/reviews" className="text-sm underline-offset-4 hover:underline">
            Відгуки
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {DEMO_MENTIONS.map((m) => (
            <a
              key={m.id}
              href="https://www.instagram.com/blancoone/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-mist"
            >
              <Image
                src={m.image}
                alt={m.handle}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="25vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                <p className="font-medium">{m.handle}</p>
                <p className="text-white/70">{m.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
