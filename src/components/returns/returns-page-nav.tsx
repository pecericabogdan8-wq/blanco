"use client";

import { useEffect, useRef, useState } from "react";
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
  const lockRef = useRef(false);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const nodes = SECTIONS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => Boolean(el)
    );
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;
        let best: { id: SectionId; ratio: number } | null = null;
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = e.target.id as SectionId;
          if (!SECTIONS.includes(id)) continue;
          const ratio = e.intersectionRatio;
          if (!best || ratio > best.ratio) best = { id, ratio };
        }
        if (best) setActive(best.id);
      },
      {
        rootMargin: "-96px 0px -55% 0px",
        threshold: 0.2,
      }
    );

    for (const el of nodes) observer.observe(el);
    return () => {
      observer.disconnect();
      if (lockTimer.current) clearTimeout(lockTimer.current);
    };
  }, []);

  function goTo(id: SectionId) {
    const el = document.getElementById(id);
    if (!el) return;
    lockRef.current = true;
    setActive(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => {
      lockRef.current = false;
    }, 700);
  }

  return (
    <nav
      className="sticky top-16 z-20 mt-8 -mx-4 flex gap-1 overflow-x-auto border-y border-border bg-[#f7f6f3]/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:px-0"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "shrink-0 px-3 py-2 text-[11px] tracking-[0.14em] uppercase",
              isActive
                ? "bg-ink text-mist"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => goTo(item.id)}
          >
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
