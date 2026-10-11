"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  hint?: string;
  products: Product[];
  bestsellerIds?: string[];
};

const DRAG_THRESHOLD = 6;

export function HomeProductRail({
  title,
  hint,
  products,
  bestsellerIds = [],
}: Props) {
  const t = useTranslations("Home");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    moved: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const rafSyncRef = useRef<number | null>(null);
  const stateRef = useRef({ canPrev: false, canNext: false, hasOverflow: false, progress: 0 });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);

  const sync = useCallback((force = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const left = el.scrollLeft;
    const next = {
      hasOverflow: max > 8,
      canPrev: left > 4,
      canNext: left < max - 4,
      progress: max > 0 ? Math.min(1, left / max) : 0,
    };
    const prev = stateRef.current;
    const changed =
      force ||
      prev.hasOverflow !== next.hasOverflow ||
      prev.canPrev !== next.canPrev ||
      prev.canNext !== next.canNext ||
      Math.abs(prev.progress - next.progress) > 0.01;
    if (!changed) return;
    stateRef.current = next;
    setHasOverflow(next.hasOverflow);
    setCanPrev(next.canPrev);
    setCanNext(next.canNext);
    setProgress(next.progress);
  }, []);

  const scheduleSync = useCallback(() => {
    if (rafSyncRef.current != null) return;
    rafSyncRef.current = requestAnimationFrame(() => {
      rafSyncRef.current = null;
      sync();
    });
  }, [sync]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    sync(true);
    el.addEventListener("scroll", scheduleSync, { passive: true });
    const ro = new ResizeObserver(() => scheduleSync());
    ro.observe(el);
    window.addEventListener("resize", scheduleSync);
    return () => {
      el.removeEventListener("scroll", scheduleSync);
      ro.disconnect();
      window.removeEventListener("resize", scheduleSync);
      if (rafSyncRef.current != null) cancelAnimationFrame(rafSyncRef.current);
    };
  }, [scheduleSync, sync, products.length]);

  useEffect(() => {
    const id = window.setTimeout(() => sync(true), 100);
    return () => window.clearTimeout(id);
  }, [sync, products]);

  function stepSize() {
    const el = scrollerRef.current;
    if (!el) return 280;
    const card = el.querySelector<HTMLElement>("[data-rail-card]");
    const styles = getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 20;
    return card ? card.offsetWidth + gap : Math.max(240, el.clientWidth * 0.55);
  }

  function scrollByDir(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * stepSize(), behavior: "smooth" });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      if (e.button !== 0) return;
      const target = e.target as Element | null;
      if (target?.closest?.("button, [data-rail-nav]")) return;

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startScroll: el!.scrollLeft,
        moved: false,
      };
    }

    function onPointerMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.startX;
      if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) {
        d.moved = true;
        suppressClickRef.current = true;
        setDragging(true);
        try {
          el!.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }
      if (!d.moved) return;
      e.preventDefault();
      el!.scrollLeft = d.startScroll - dx;
      scheduleSync();
    }

    function onPointerUp(e: PointerEvent) {
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      if (d.moved) {
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 0);
      } else {
        suppressClickRef.current = false;
      }
      dragRef.current = null;
      setDragging(false);
      sync();
    }

    function onClickCapture(e: MouseEvent) {
      if (!suppressClickRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }

    function onDragStart(e: DragEvent) {
      e.preventDefault();
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("dragstart", onDragStart);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("dragstart", onDragStart);
    };
  }, [scheduleSync, sync, products.length]);

  if (products.length === 0) return null;

  return (
    <section className="w-full border-b border-border/70 bg-[#f6f5f2] py-12 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Blanco
          </p>
          <h2 className="mt-1.5 font-script text-[clamp(2.75rem,8vw,4.25rem)] leading-[0.9] text-ink">
            {title}
          </h2>
          {hint ? (
            <p className="mt-2.5 max-w-md text-sm leading-relaxed text-foreground/70">
              {hint}
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative mt-8 sm:mt-9">
        {hasOverflow && (
          <>
            <button
              type="button"
              data-rail-nav
              aria-label={t("prev")}
              disabled={!canPrev}
              onClick={() => scrollByDir(-1)}
              className={cn(
                "absolute top-1/2 left-1 z-20 -translate-y-1/2 cursor-pointer p-1.5 text-ink transition hover:scale-110 sm:left-3",
                "disabled:pointer-events-none disabled:opacity-30"
              )}
            >
              <ChevronLeft className="size-8 stroke-[1.35] drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] sm:size-9" />
            </button>
            <button
              type="button"
              data-rail-nav
              aria-label={t("next")}
              disabled={!canNext}
              onClick={() => scrollByDir(1)}
              className={cn(
                "absolute top-1/2 right-1 z-20 -translate-y-1/2 cursor-pointer p-1.5 text-ink transition hover:scale-110 sm:right-3",
                "disabled:pointer-events-none disabled:opacity-30"
              )}
            >
              <ChevronRight className="size-8 stroke-[1.35] drop-shadow-[0_1px_3px_rgba(255,255,255,0.9)] sm:size-9" />
            </button>
          </>
        )}

        <div
          ref={scrollerRef}
          className={cn(
            "flex gap-3 overflow-x-auto overscroll-x-contain px-10 pb-2 sm:gap-5 sm:px-14 md:gap-7",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            "touch-pan-x select-none",
            dragging ? "cursor-grabbing" : "cursor-grab"
          )}
          style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
        >
          {products.map((p) => (
            <div
              key={p.id}
              data-rail-card
              className="w-[min(72vw,16.5rem)] shrink-0 sm:w-[min(42vw,17.5rem)] md:w-[calc((100%-5.25rem)/4)] md:min-w-[14rem] md:max-w-[18rem]"
              draggable={false}
            >
              <ProductCard product={p} bestsellerIds={bestsellerIds} />
            </div>
          ))}
          <div className="w-px shrink-0" aria-hidden />
        </div>
      </div>

      {hasOverflow && (
        <div className="mx-auto mt-7 max-w-7xl px-4 sm:px-6">
          <div className="h-px w-full bg-border/80">
            <div
              className="h-px origin-left bg-ink transition-transform duration-200 ease-out"
              style={{ transform: `scaleX(${0.12 + progress * 0.88})` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
