"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SECTIONS = ["dostavka", "povernennya", "zayavka"] as const;

type SectionId = (typeof SECTIONS)[number];

export function ReturnsPageNav({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: { id: SectionId; label: string }[];
}) {
  const [active, setActive] = useState<SectionId>("dostavka");

  useEffect(() => {
    const nodes = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0)
          );
        const top = visible[0]?.target?.id as SectionId | undefined;
        if (top && SECTIONS.includes(top)) setActive(top);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0, 0.15, 0.35, 0.55],
      }
    );

    for (const el of nodes) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="sticky top-16 z-20 mt-8 -mx-4 flex gap-1 overflow-x-auto border-y border-border bg-[#f7f6f3]/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "shrink-0 px-3 py-2 text-[11px] tracking-[0.14em] uppercase transition",
              isActive
                ? "bg-ink text-mist"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setActive(item.id)}
          >
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
