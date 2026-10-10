"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type ReviewRow = {
  id: string;
  author: string;
  rating: number;
  text: string;
  city?: string | null;
  createdAt?: string;
  date?: string;
};

type Mention = {
  id: string;
  handle: string;
  caption: string;
  image: string;
};

export default function ReviewsPage() {
  const t = useTranslations("Reviews");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [mentions, setMentions] = useState<Mention[]>([]);

  useEffect(() => {
    void (async () => {
      try {
        const [revRes, igRes] = await Promise.all([
          fetch("/api/reviews"),
          fetch("/api/instagram"),
        ]);
        const rev = await revRes.json();
        const ig = await igRes.json();
        if (rev.ok && Array.isArray(rev.reviews)) setReviews(rev.reviews);
        if (ig.ok && Array.isArray(ig.mentions)) setMentions(ig.mentions);
      } catch {
        /* keep empty */
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight uppercase sm:text-4xl">
        {t("title")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>

      {mentions.length > 0 && (
        <div className="mt-10 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mentions.map((m) => (
            <a
              key={m.id}
              href="https://www.instagram.com/blancoone/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-16 shrink-0 flex-col items-center gap-1.5 sm:w-20"
            >
              <span className="relative size-16 overflow-hidden rounded-full ring-2 ring-[#c41e3a] ring-offset-2 sm:size-20">
                <Image
                  src={m.image}
                  alt={m.handle}
                  fill
                  quality={85}
                  className="object-cover"
                  sizes="80px"
                />
              </span>
              <span className="truncate text-[10px] tracking-wide uppercase">
                {m.handle.replace("@", "")}
              </span>
            </a>
          ))}
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="mt-12 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <blockquote key={r.id} className="border border-border bg-white p-6">
              <p className="text-sm tracking-widest text-[#c41e3a]">
                {"★".repeat(r.rating)}
                <span className="text-muted-foreground">
                  {"☆".repeat(Math.max(0, 5 - r.rating))}
                </span>
              </p>
              <p className="mt-3 leading-relaxed">{r.text}</p>
              <footer className="mt-4 text-sm text-muted-foreground">
                {r.author}
                {r.city ? `, ${r.city}` : ""}
                {(r.date || r.createdAt) &&
                  ` · ${r.date ?? String(r.createdAt).slice(0, 10)}`}
              </footer>
            </blockquote>
          ))}
        </div>
      )}

      {mentions.length > 0 && (
        <section className="mt-20">
          <div className="mb-2 flex items-baseline justify-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight uppercase sm:text-3xl">
              {t("instagramTitle")}{" "}
              <span className="text-[#c41e3a]">Instagram</span>
            </h2>
          </div>
          <p className="mb-8 text-center text-muted-foreground">
            {t.rich("instagramHint", {
              handle: (chunks) => (
                <a
                  href="https://www.instagram.com/blancoone/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {chunks}
                </a>
              ),
            })}
          </p>
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4 md:gap-2">
            {mentions.map((m) => (
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
                  quality={90}
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="25vw"
                />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">{m.handle}</p>
                  <p className="line-clamp-2 text-[11px] text-white/75">
                    {m.caption}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
