"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ImagePlus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  /** Якщо товар уже в базі — зміни каруселі одразу пишуться туди */
  livePersist?: boolean;
};

export function ImageGalleryField({
  images,
  onChange,
  livePersist = false,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileDrop, setFileDrop] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) {
      toast.error("Оберіть зображення (JPG / PNG / WEBP)");
      return;
    }
    setUploading(true);
    setProgress(12);
    try {
      const body = new FormData();
      for (const f of list) body.append("files", f);
      setProgress(45);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      setProgress(85);
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? "Помилка завантаження");
        return;
      }
      const urls = data.urls as string[];
      onChange([...imagesRef.current, ...urls]);
      setBroken((prev) => {
        const next = { ...prev };
        for (const u of urls) delete next[u];
        return next;
      });
      setProgress(100);
      toast.success(
        livePersist
          ? urls.length === 1
            ? "Фото додано й збережено"
            : `Додано ${urls.length} фото · збережено`
          : urls.length === 1
            ? "Фото додано в карусель"
            : `Додано ${urls.length} фото`
      );
    } catch {
      toast.error("Не вдалося завантажити");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function setPrimary(index: number) {
    if (index === 0) return;
    const next = [...imagesRef.current];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
    toast.success(
      livePersist
        ? "Головне фото збережено · видно в каталозі"
        : "Головне фото обрано · збережіть товар"
    );
  }

  function removeAt(index: number) {
    const next = imagesRef.current.filter((_, i) => i !== index);
    onChange(next);
    toast.message(
      next.length
        ? livePersist
          ? "Фото видалено з каруселі"
          : "Фото прибрано · збережіть товар"
        : "Галерея порожня"
    );
  }

  function move(from: number, to: number) {
    const list = imagesRef.current;
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function onThumbDragStart(e: React.DragEvent, i: number) {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
    setDragIndex(i);
    setOverIndex(i);
  }

  function onThumbDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex === null) return;
    if (overIndex !== i) setOverIndex(i);
  }

  function onThumbDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    e.stopPropagation();
    const from =
      dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    if (Number.isFinite(from) && from !== i) {
      move(from, i);
      if (livePersist) {
        toast.message(`Позиція ${from + 1} → ${i + 1}`);
      }
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  function onThumbDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  const hasImages = images.length > 0;
  const reordering = dragIndex !== null;
  const previewSrc =
    previewIndex != null ? images[previewIndex] ?? null : null;

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Фото-карусель</p>
          <p className="text-[11px] text-muted-foreground">
            Перше = обкладинка в каталозі · клік = перегляд · ручка = перетягнути
            {livePersist
              ? " · зміни одразу в базі"
              : " · після «Додати в базу»"}
          </p>
        </div>
        {hasImages && (
          <p className="text-[11px] tabular-nums text-muted-foreground">
            {images.length} у каруселі
          </p>
        )}
      </div>

      <div
        onDragOver={(e) => {
          if (reordering) return;
          e.preventDefault();
          setFileDrop(true);
        }}
        onDragLeave={() => setFileDrop(false)}
        onDrop={(e) => {
          if (reordering) return;
          e.preventDefault();
          setFileDrop(false);
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files);
        }}
        className={cn(
          "relative overflow-hidden border border-dashed transition",
          fileDrop
            ? "border-ink bg-[#ebe8e2]"
            : "border-border bg-[#faf9f7] hover:border-ink/40"
        )}
      >
        <label
          htmlFor={inputId}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-7 text-center sm:py-8",
            uploading && "pointer-events-none opacity-60"
          )}
        >
          {uploading ? (
            <>
              <Upload className="size-5 animate-pulse text-ink" />
              <p className="text-sm font-medium">Завантаження…</p>
              <div className="mt-1 h-1 w-40 overflow-hidden bg-border">
                <div
                  className="h-full bg-ink transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <ImagePlus className="size-5 text-muted-foreground" />
              <p className="text-sm">
                {fileDrop
                  ? "Відпустіть, щоб додати"
                  : "Перетягніть фото або натисніть"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                JPG · PNG · WEBP · кілька одразу · до 25 МБ
              </p>
              <span className="mt-1 inline-flex items-center gap-1.5 border border-border bg-white px-3 py-1.5 text-[11px] font-medium tracking-wide uppercase">
                <Upload className="size-3" />
                Додати фото
              </span>
            </>
          )}
        </label>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />
      </div>

      {hasImages && (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4">
          {images.map((src, i) => {
            const isPrimary = i === 0;
            const isDragging = dragIndex === i;
            const isOver =
              overIndex === i && dragIndex !== null && dragIndex !== i;
            const isBroken = Boolean(broken[src]);

            return (
              <li
                key={`${src}-${i}`}
                onDragOver={(e) => onThumbDragOver(e, i)}
                onDrop={(e) => onThumbDrop(e, i)}
                className={cn(
                  "group relative overflow-hidden border bg-[#f0eee9] transition",
                  isPrimary ? "border-ink ring-1 ring-ink" : "border-border",
                  isDragging && "opacity-40 scale-[0.97]",
                  isOver && "ring-2 ring-[#c41e3a] ring-offset-1"
                )}
              >
                <div className="relative aspect-[3/4]">
                  {!isBroken ? (
                    <button
                      type="button"
                      title="Відкрити перегляд"
                      className="absolute inset-0 cursor-zoom-in"
                      onClick={() => setPreviewIndex(i)}
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        quality={85}
                        draggable={false}
                        className="pointer-events-none select-none object-cover"
                        sizes="180px"
                        unoptimized
                        onError={() =>
                          setBroken((prev) => ({ ...prev, [src]: true }))
                        }
                      />
                    </button>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[#ebe8e2] px-2 text-center">
                      <ImagePlus className="size-5 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">
                        Файл недоступний — завантажте знову
                      </p>
                    </div>
                  )}

                  {/* Drag only via grip — click on photo = preview */}
                  <button
                    type="button"
                    title="Перетягнути"
                    draggable
                    onDragStart={(e) => onThumbDragStart(e, i)}
                    onDragEnd={onThumbDragEnd}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-1.5 right-1.5 z-10 flex size-7 cursor-grab items-center justify-center bg-black/55 text-white active:cursor-grabbing"
                  >
                    <GripVertical className="size-3.5" />
                  </button>

                  <div className="pointer-events-none absolute inset-0 z-[1] flex flex-col justify-between bg-gradient-to-b from-black/45 via-transparent to-black/50 p-1.5 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
                    <div className="pointer-events-auto flex justify-between gap-1 pr-9">
                      <button
                        type="button"
                        title="Зробити головним"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(i);
                        }}
                        className={cn(
                          "flex size-7 items-center justify-center bg-white/95 text-ink transition hover:bg-white",
                          isPrimary && "bg-ink text-white hover:bg-ink"
                        )}
                      >
                        <Star
                          className={cn("size-3.5", isPrimary && "fill-current")}
                        />
                      </button>
                      <button
                        type="button"
                        title="Видалити з каруселі"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAt(i);
                        }}
                        className="flex size-7 items-center justify-center bg-white/95 text-[#9b1c1c] transition hover:bg-[#9b1c1c] hover:text-white"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    <div className="pointer-events-auto flex items-center justify-between gap-1">
                      <button
                        type="button"
                        title="Ліворуч"
                        disabled={i === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i - 1);
                        }}
                        className="flex size-7 items-center justify-center bg-white/95 text-ink disabled:opacity-30"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <span className="bg-black/55 px-1.5 py-0.5 text-[10px] tabular-nums text-white">
                        {i + 1}/{images.length}
                      </span>
                      <button
                        type="button"
                        title="Праворуч"
                        disabled={i === images.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          move(i, i + 1);
                        }}
                        className="flex size-7 items-center justify-center bg-white/95 text-ink disabled:opacity-30"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {isPrimary ? (
                  <span className="pointer-events-none absolute top-1.5 left-1.5 z-[2] bg-ink px-1.5 py-0.5 text-[9px] tracking-wider text-white uppercase group-hover:opacity-0">
                    Головне
                  </span>
                ) : (
                  <span className="pointer-events-none absolute top-1.5 left-1.5 z-[2] bg-black/55 px-1.5 py-0.5 text-[9px] tabular-nums text-white group-hover:opacity-0">
                    {i + 1}
                  </span>
                )}
              </li>
            );
          })}

          <li>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 border border-dashed border-border bg-[#faf9f7] text-muted-foreground transition hover:border-ink/50 hover:text-ink"
            >
              <ImagePlus className="size-5" />
              <span className="text-[11px] tracking-wide uppercase">Ще фото</span>
            </button>
          </li>
        </ul>
      )}

      {hasImages && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-3.5" />
            Додати ще
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[#9b1c1c] hover:bg-[#9b1c1c]/5 hover:text-[#9b1c1c]"
            onClick={() => {
              if (!confirm(`Прибрати всі ${images.length} фото з каруселі?`))
                return;
              onChange([]);
              toast.message("Карусель очищено");
            }}
          >
            <Trash2 className="size-3.5" />
            Очистити все
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Клік по фото — збільшити · ручка ⋮⋮ — переставити
          </p>
        </div>
      )}

      {previewSrc != null && previewIndex != null && (
        <div
          role="dialog"
          aria-modal
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            type="button"
            aria-label="Закрити"
            className="absolute top-4 right-4 flex size-10 items-center justify-center bg-white/95 text-ink"
            onClick={() => setPreviewIndex(null)}
          >
            <X className="size-5" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Попереднє"
                className="absolute left-3 flex size-10 items-center justify-center bg-white/90 text-ink sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(
                    (previewIndex - 1 + images.length) % images.length
                  );
                }}
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                aria-label="Наступне"
                className="absolute right-3 flex size-10 items-center justify-center bg-white/90 text-ink sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((previewIndex + 1) % images.length);
                }}
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
          <div
            className="relative max-h-[85vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className="mx-auto max-h-[85vh] w-auto max-w-full object-contain"
            />
            <p className="mt-2 text-center text-xs text-white/70">
              {previewIndex + 1} / {images.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
