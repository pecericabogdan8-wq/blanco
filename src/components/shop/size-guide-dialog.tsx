"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sortSizes } from "@/lib/format";
import type { Product } from "@/lib/types";

export function SizeGuideDialog({
  sizeChart,
  triggerClassName,
}: {
  sizeChart: NonNullable<Product["sizeChart"]>;
  triggerClassName?: string;
}) {
  const t = useTranslations("Product");
  const rank = new Map(
    sortSizes(sizeChart.map((r) => String(r.size))).map((s, i) => [s, i])
  );
  const rows = [...sizeChart].sort(
    (a, b) =>
      (rank.get(String(a.size).toUpperCase()) ?? 99) -
      (rank.get(String(b.size).toUpperCase()) ?? 99)
  );

  return (
    <Dialog>
      <DialogTrigger
        className={
          triggerClassName ??
          "cursor-pointer text-[11px] text-foreground underline underline-offset-2"
        }
      >
        {t("sizeGuide")}
      </DialogTrigger>
      <DialogContent
        className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl leading-none sm:text-3xl">
            {t("sizeGuide")}
          </DialogTitle>
          <DialogDescription>{t("sizeHint")}</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto border border-border">
          <table className="w-full min-w-[240px] text-sm">
            <thead>
              <tr className="border-b border-border bg-[#faf9f7] text-left text-[11px] tracking-wide text-muted-foreground uppercase">
                <th className="px-3 py-2">{t("size")}</th>
                <th className="px-3 py-2">{t("length")}</th>
                <th className="px-3 py-2">{t("width")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.size} className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2.5 font-medium">{row.size}</td>
                  <td className="px-3 py-2.5 tabular-nums">{row.length}</td>
                  <td className="px-3 py-2.5 tabular-nums">
                    {row.width ?? row.chest ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
