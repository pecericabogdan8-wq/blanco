"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.35;
const AUTOPLAY_MS = 4500;
const SWIPE_FLIP_PX = 40;
const STRIP_DRAG_CLICK_PX = 6;

/** Reveal active thumb in horizontal (mobile) or vertical (desktop) strip. */
function revealThumbInStrip(
  strip: HTMLElement,
  btn: HTMLElement,
  neighborPad = 8
) {
  const vertical = strip.scrollHeight > strip.clientHeight + 2;
  const nav = strip.getBoundingClientRect();
  const r = btn.getBoundingClientRect();
  const next = btn.nextElementSibling as HTMLElement | null;
  const prev = btn.previousElementSibling as HTMLElement | null;

  if (vertical) {
    let delta = 0;
    if (r.bottom > nav.bottom - 4) {
      if (next) {
        delta = next.getBoundingClientRect().bottom - nav.bottom + neighborPad;
      } else {
        delta = r.bottom - nav.bottom + neighborPad;
      }
    } else if (r.top < nav.top + 4) {
      if (prev) {
        delta = prev.getBoundingClientRect().top - nav.top - neighborPad;
      } else {
        delta = r.top - nav.top - neighborPad;
      }
    } else if (next) {
      const nr = next.getBoundingClientRect();
      if (nr.bottom > nav.bottom - 1) {
        delta = nr.bottom - nav.bottom + neighborPad;
      }
    }
    if (prev && !delta) {
      const pr = prev.getBoundingClientRect();
      if (pr.top < nav.top + 1) {
        delta = pr.top - nav.top - neighborPad;
      }
    }
    if (!delta) return;
    strip.scrollTo({ top: strip.scrollTop + delta, behavior: "smooth" });
    return;
  }

  let delta = 0;
  if (r.right > nav.right - 4) {
    if (next) {
      delta = next.getBoundingClientRect().right - nav.right + neighborPad;
    } else {
      delta = r.right - nav.right + neighborPad;
    }
  } else if (r.left < nav.left + 4) {
    if (prev) {
      delta = prev.getBoundingClientRect().left - nav.left - neighborPad;
    } else {
      delta = r.left - nav.left - neighborPad;
    }
  } else if (next) {
    const nr = next.getBoundingClientRect();
    if (nr.right > nav.right - 1) {
      delta = nr.right - nav.right + neighborPad;
    }
  }
  if (prev && !delta) {
    const pr = prev.getBoundingClientRect();
    if (pr.left < nav.left + 1) {
      delta = pr.left - nav.left - neighborPad;
    }
  }
  if (!delta) return;
  strip.scrollTo({ left: strip.scrollLeft + delta, behavior: "smooth" });
}

type Props = {
  images: string[];
  alt: string;
};

function LightboxArrow({
  dir,
  onClick,
}: {
  dir: "prev" | "next";
  onClick: () => void;
}) {
  const t = useTranslations("Gallery");
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "prev" ? t("prev") : t("next")}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 z-20 -translate-y-1/2 cursor-pointer p-1 text-white",
        "transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "opacity-70 hover:scale-125 hover:opacity-100 active:scale-95",
        dir === "prev" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      )}
    >
      <Icon className="size-10 stroke-[1.4] sm:size-12" />
    </button>
  );
}

export function ProductGallery({ images, alt }: Props) {
  const t = useTranslations("Gallery");
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    active: boolean;
    x: number;
    y: number;
    panX: number;
    panY: number;
  } | null>(null);
  const pinchRef = useRef<{ dist: number; zoom: number } | null>(null);
  const stripDragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
    moved: boolean;
  } | null>(null);
  const mainSwipeRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const suppressThumbClickRef = useRef(false);

  zoomRef.current = zoom;
  panRef.current = pan;
  const total = images.length;
  const current = images[idx] ?? images[0];

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function clampZoom(z: number) {
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  }

  function scrollThumbs(dir: "up" | "down") {
    const strip = stripRef.current;
    if (!strip) return;
    const step = Math.max(72, strip.clientHeight * 0.55);
    strip.scrollBy({
      top: dir === "up" ? -step : step,
      behavior: "smooth",
    });
  }

  const revealActive = useEffectEvent((i: number) => {
    const strip = stripRef.current;
    const btn = thumbRefs.current[i];
    if (!strip || !btn) return;
    requestAnimationFrame(() => {
      revealThumbInStrip(strip, btn);
    });
  });

  const go = useEffectEvent((delta: number) => {
    if (total <= 1) return;
    resetView();
    setIdx((i) => (i + delta + total) % total);
  });

  useEffect(() => {
    setIdx(0);
    resetView();
  }, [images]);

  useEffect(() => {
    revealActive(idx);
  }, [idx]);

  // Telegram-style autoplay — pauses on hover / lightbox / drag / reduced-motion
  useEffect(() => {
    if (total <= 1 || open || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [total, open, paused, idx]);

  useEffect(() => {
    if (!open) {
      resetView();
      setDragging(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
      if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + ZOOM_STEP));
      if (e.key === "-") {
        setZoom((z) => {
          const next = clampZoom(z - ZOOM_STEP);
          if (next <= 1) setPan({ x: 0, y: 0 });
          return next;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Lightbox zoom / pinch
  useEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const next = clampZoom(zoomRef.current + delta);
      setZoom(next);
      if (next <= 1) setPan({ x: 0, y: 0 });
    }

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length === 2) {
        const a = e.touches[0];
        const b = e.touches[1];
        if (!a || !b) return;
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        pinchRef.current = { dist, zoom: zoomRef.current };
        dragRef.current = null;
        setDragging(false);
      } else if (e.touches.length === 1 && zoomRef.current > 1) {
        const t0 = e.touches[0];
        dragRef.current = {
          active: true,
          x: t0.clientX,
          y: t0.clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
        setDragging(true);
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (e.touches.length === 2 && pinchRef.current) {
        e.preventDefault();
        const a = e.touches[0];
        const b = e.touches[1];
        if (!a || !b) return;
        const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        const next = clampZoom(
          pinchRef.current.zoom * (dist / pinchRef.current.dist)
        );
        setZoom(next);
        if (next <= 1) setPan({ x: 0, y: 0 });
      } else if (e.touches.length === 1 && dragRef.current?.active) {
        e.preventDefault();
        const t0 = e.touches[0];
        const d = dragRef.current;
        setPan({
          x: d.panX + (t0.clientX - d.x),
          y: d.panY + (t0.clientY - d.y),
        });
      }
    }

    function onTouchEnd() {
      pinchRef.current = null;
      if (dragRef.current) dragRef.current.active = false;
      setDragging(false);
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open]);

  // Thumb strip: only click-drag scroll (no mouse wheel). Autoplay flips photos separately.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || total <= 1) return;

    function onWheel(e: WheelEvent) {
      // Block wheel over carousel — page may still scroll; strip itself does not
      e.preventDefault();
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const el = strip!;
      // Don't capture yet — plain click must reach the thumb button
      stripDragRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        scrollLeft: el.scrollLeft,
        scrollTop: el.scrollTop,
        moved: false,
      };
      setPaused(true);
    }

    function onPointerMove(e: PointerEvent) {
      const d = stripDragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const el = strip!;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (!d.moved && Math.hypot(dx, dy) > STRIP_DRAG_CLICK_PX) {
        d.moved = true;
        el.setPointerCapture(e.pointerId);
        suppressThumbClickRef.current = true;
      }
      if (!d.moved) return;
      e.preventDefault();
      const vertical = el.scrollHeight > el.clientHeight + 2;
      if (vertical) {
        el.scrollTop = d.scrollTop - dy;
      } else {
        el.scrollLeft = d.scrollLeft - dx;
      }
    }

    function onPointerUp(e: PointerEvent) {
      const d = stripDragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      if (d.moved) {
        // Keep suppress until after click would fire
        window.setTimeout(() => {
          suppressThumbClickRef.current = false;
        }, 0);
      } else {
        suppressThumbClickRef.current = false;
      }
      stripDragRef.current = null;
      setPaused(false);
    }

    strip.addEventListener("wheel", onWheel, { passive: false });
    strip.addEventListener("pointerdown", onPointerDown);
    strip.addEventListener("pointermove", onPointerMove);
    strip.addEventListener("pointerup", onPointerUp);
    strip.addEventListener("pointercancel", onPointerUp);
    return () => {
      strip.removeEventListener("wheel", onWheel);
      strip.removeEventListener("pointerdown", onPointerDown);
      strip.removeEventListener("pointermove", onPointerMove);
      strip.removeEventListener("pointerup", onPointerUp);
      strip.removeEventListener("pointercancel", onPointerUp);
    };
  }, [total]);

  // Main photo: finger/mouse swipe to flip, tap to open fullscreen
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0 && e.pointerType !== "touch") return;
      const target = e.target as Element | null;
      if (target?.closest?.("[data-gallery-nav]")) return;
      const stage = mainRef.current;
      if (!stage) return;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      mainSwipeRef.current = {
        pointerId: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: false,
      };
      setPaused(true);
    }

    function onPointerMove(e: PointerEvent) {
      const d = mainSwipeRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) > 8) d.moved = true;
      // Lock horizontal gallery swipe so the page doesn't steal the gesture
      if (d.moved && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
        e.preventDefault();
      }
    }

    function onPointerUp(e: PointerEvent) {
      const d = mainSwipeRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      const target = e.target as Element | null;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      mainSwipeRef.current = null;
      setPaused(false);
      const stage = mainRef.current;
      try {
        stage?.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }

      if (target?.closest?.("[data-gallery-nav]")) return;

      if (
        total > 1 &&
        Math.abs(dx) >= SWIPE_FLIP_PX &&
        Math.abs(dx) > Math.abs(dy) * 0.85
      ) {
        go(dx < 0 ? 1 : -1);
        return;
      }
      if (!d.moved) {
        setOpen(true);
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [total]);

  if (!current) return null;

  return (
    <>
      {/*
        Main aspect-ratio sets the height. On md+ the thumb rail is absolute top-0
        with max-h-full: ↑/↓ hug the thumbs; only when many thumbs hit the main bottom.
      */}
      <div
        className={cn(
          "relative flex flex-col gap-2",
          total > 1 && "md:pl-[calc(4.25rem+0.75rem)] lg:pl-[calc(4.5rem+0.75rem)] xl:pl-[calc(5rem+0.75rem)]"
        )}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={mainRef}
          className="img-zoom group/stage relative aspect-[3/4] w-full cursor-zoom-in touch-pan-y overflow-hidden bg-[#eceae6]"
          style={{ touchAction: "pan-y" }}
        >
          <Image
            key={current}
            src={current}
            alt={alt}
            fill
            priority
            quality={95}
            className="object-cover object-center will-change-transform"
            sizes="(max-width:768px) 100vw, 48vw"
            unoptimized={current.startsWith("/products/")}
            draggable={false}
          />

          {total > 1 && (
            <>
              <button
                type="button"
                data-gallery-nav
                aria-label={t("prev")}
                className="absolute top-1/2 left-1 z-20 -translate-y-1/2 cursor-pointer p-1.5 text-ink/75 transition hover:scale-110 hover:text-ink sm:left-2"
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
              >
                <ChevronLeft className="size-8 stroke-[1.4] drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)] sm:size-9" />
              </button>
              <button
                type="button"
                data-gallery-nav
                aria-label={t("next")}
                className="absolute top-1/2 right-1 z-20 -translate-y-1/2 cursor-pointer p-1.5 text-ink/75 transition hover:scale-110 hover:text-ink sm:right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
              >
                <ChevronRight className="size-8 stroke-[1.4] drop-shadow-[0_1px_8px_rgba(255,255,255,0.85)] sm:size-9" />
              </button>
            </>
          )}

          {total > 1 && !open && (
            <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-[11px] tabular-nums tracking-[0.14em] text-ink/50 md:hidden">
              {idx + 1} / {total}
            </p>
          )}

          <span className="sr-only">{t("openFullscreen")}</span>
        </div>

        {total > 1 && (
          <div
            className={cn(
              "flex flex-col overflow-hidden",
              // mobile: under main
              "w-full",
              // desktop: hug thumbs from the top; max-h = main photo height (not stretched to bottom)
              "md:absolute md:top-0 md:left-0 md:max-h-full md:w-[4.25rem] lg:w-[4.5rem] xl:w-[5rem]"
            )}
          >
            <button
              type="button"
              aria-label={t("scrollUp")}
              className="hidden h-7 w-full shrink-0 cursor-pointer items-center justify-center text-ink/45 transition hover:text-ink md:flex"
              onClick={() => {
                scrollThumbs("up");
                go(-1);
              }}
            >
              <ChevronUp className="size-5 stroke-[1.5]" />
            </button>

            <div
              ref={stripRef}
              className={cn(
                "flex cursor-grab gap-1 active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
                "overflow-x-auto touch-pan-x",
                // flex-1 only eats leftover when rail hits max-h; otherwise sizes to thumbs
                "md:min-h-0 md:flex-1 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:touch-pan-y"
              )}
            >
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  ref={(el) => {
                    thumbRefs.current[i] = el;
                  }}
                  type="button"
                  onClick={() => {
                    if (suppressThumbClickRef.current) return;
                    resetView();
                    setIdx(i);
                  }}
                  className={cn(
                    "group/thumb relative aspect-[3/4] w-[4.25rem] shrink-0 overflow-hidden border-2 bg-[#eceae6] transition-[opacity,border-color] duration-200 sm:w-[4.75rem] md:w-full",
                    i === idx
                      ? "border-[#c41e3a]"
                      : "border-transparent opacity-75 hover:opacity-100"
                  )}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    quality={85}
                    className="object-cover object-center transition duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/thumb:scale-105"
                    sizes="80px"
                    unoptimized={src.startsWith("/products/")}
                    draggable={false}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label={t("scrollDown")}
              className="hidden h-7 w-full shrink-0 cursor-pointer items-center justify-center text-ink/45 transition hover:text-ink md:flex"
              onClick={() => {
                scrollThumbs("down");
                go(1);
              }}
            >
              <ChevronDown className="size-5 stroke-[1.5]" />
            </button>
          </div>
        )}
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("viewer")}
          className="fixed inset-0 z-[80] flex animate-in items-center justify-center bg-black/70 fade-in-0 duration-200 supports-backdrop-filter:bg-black/60 supports-backdrop-filter:backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          {total > 1 && (
            <p className="pointer-events-none absolute top-4 left-4 z-30 text-sm tabular-nums tracking-wide text-white/90 sm:top-5 sm:left-5">
              {idx + 1}/{total}
            </p>
          )}

          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 sm:top-4 sm:right-4 sm:gap-1.5">
            <button
              type="button"
              aria-label={t("zoomOut")}
              className="cursor-pointer p-1.5 text-white/85 transition hover:text-white disabled:opacity-35"
              disabled={zoom <= ZOOM_MIN}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => {
                  const next = clampZoom(z - ZOOM_STEP);
                  if (next <= 1) setPan({ x: 0, y: 0 });
                  return next;
                });
              }}
            >
              <Minus className="size-6 stroke-[1.5] sm:size-7" />
            </button>
            <button
              type="button"
              aria-label={t("zoomIn")}
              className="cursor-pointer p-1.5 text-white/85 transition hover:text-white disabled:opacity-35"
              disabled={zoom >= ZOOM_MAX}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => clampZoom(z + ZOOM_STEP));
              }}
            >
              <Plus className="size-6 stroke-[1.5] sm:size-7" />
            </button>
            <button
              type="button"
              aria-label={t("close")}
              className="cursor-pointer p-1.5 text-white/85 transition duration-300 hover:scale-110 hover:text-white active:scale-95"
              onClick={() => setOpen(false)}
            >
              <X className="size-7 stroke-[1.35] sm:size-8" />
            </button>
          </div>

          <p className="pointer-events-none absolute bottom-4 left-1/2 z-30 hidden -translate-x-1/2 text-[11px] tracking-wide text-white/50 sm:block">
            {t("zoomHint")}
          </p>

          {total > 1 && zoom <= 1.05 && (
            <>
              <LightboxArrow dir="prev" onClick={() => go(-1)} />
              <LightboxArrow dir="next" onClick={() => go(1)} />
            </>
          )}

          <div
            ref={stageRef}
            className={cn(
              "relative h-[min(90vh,100%)] w-[min(92vw,960px)] touch-none overflow-hidden animate-in zoom-in-95 fade-in-0 duration-300 sm:w-[min(78vw,900px)]",
              zoom > 1
                ? dragging
                  ? "cursor-grabbing"
                  : "cursor-grab"
                : "cursor-zoom-in"
            )}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (zoom > 1) {
                resetView();
              } else {
                setZoom(2.2);
              }
            }}
            onPointerDown={(e) => {
              if (zoom <= 1 || e.pointerType === "touch") return;
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setDragging(true);
              dragRef.current = {
                active: true,
                x: e.clientX,
                y: e.clientY,
                panX: pan.x,
                panY: pan.y,
              };
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d?.active || zoom <= 1) return;
              setPan({
                x: d.panX + (e.clientX - d.x),
                y: d.panY + (e.clientY - d.y),
              });
            }}
            onPointerUp={() => {
              if (dragRef.current) dragRef.current.active = false;
              setDragging(false);
            }}
            onPointerCancel={() => {
              if (dragRef.current) dragRef.current.active = false;
              setDragging(false);
            }}
          >
            <div
              className="relative h-full w-full will-change-transform"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: dragging ? "none" : "transform 120ms ease-out",
              }}
            >
              <Image
                key={`full-${current}`}
                src={current}
                alt={alt}
                fill
                quality={100}
                className="object-contain drop-shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
                sizes="(max-width:768px) 92vw, 78vw"
                unoptimized={current.startsWith("/products/")}
                priority
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
