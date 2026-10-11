"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

const REASONS = [
  "defective",
  "quality_dislike",
  "wrong_size",
  "other",
] as const;

export function ReturnRequestForm({ className }: { className?: string }) {
  const t = useTranslations("Returns");
  const searchParams = useSearchParams();
  const user = useShopStore((s) => s.user);
  const [orderId, setOrderId] = useState(
    () => searchParams.get("order") ?? ""
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<string>("quality_dislike");
  const [message, setMessage] = useState("");
  const [refundWanted, setRefundWanted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email || "");
    setPhone((p) => p || user.phone || "");
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          reason,
          message: message.trim(),
          refundWanted,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        toast.error(data.error ?? t("formError"));
        return;
      }
      setDone(true);
      toast.success(t("formSuccess"));
      setMessage("");
    } catch {
      toast.error(t("formError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className={cn(
          "space-y-3 border border-border bg-white p-5 sm:p-6",
          className
        )}
      >
        <h3 className="text-sm font-semibold tracking-wide uppercase">
          {t("afterTitle")}
        </h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>{t("after1")}</li>
          <li>{t("after2")}</li>
          <li>{t("after3")}</li>
          <li>{t("after4")}</li>
        </ol>
        <p className="text-sm text-muted-foreground">{t("afterSupport")}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => setDone(false)}
        >
          {t("formAnother")}
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4 border border-border bg-white p-5 sm:p-6",
        className
      )}
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        {t("formIntro")}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="return-order">{t("formOrderId")}</Label>
          <Input
            id="return-order"
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder={t("formOrderPlaceholder")}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="return-email">{t("formEmail")}</Label>
          <Input
            id="return-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("formEmailPlaceholder")}
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="return-phone">{t("formPhone")}</Label>
          <Input
            id="return-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("formPhonePlaceholder")}
            className="bg-white"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("formReason")}</Label>
          <Select
            value={reason}
            onValueChange={(v) => setReason(String(v ?? ""))}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue>
                {(v) =>
                  t(`reason_${String(v ?? "quality_dislike")}` as "reason_defective")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false} sideOffset={6}>
              {REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {t(`reason_${r}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="return-message">{t("formMessage")}</Label>
          <Textarea
            id="return-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("formMessagePlaceholder")}
            className="bg-white"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
          <span className="relative mt-0.5 inline-flex size-5 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={refundWanted}
              onChange={(e) => setRefundWanted(e.target.checked)}
              className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
            />
            <span
              className={cn(
                "flex size-5 items-center justify-center border border-ink bg-white transition peer-focus-visible:ring-2 peer-focus-visible:ring-ink/30",
                refundWanted && "bg-ink"
              )}
              aria-hidden
            >
              {refundWanted && (
                <svg
                  viewBox="0 0 12 12"
                  className="size-3 text-mist"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M2 6.5 4.5 9 10 3" />
                </svg>
              )}
            </span>
          </span>
          <span className="text-sm leading-relaxed text-muted-foreground">
            {t("formRefundWanted")}
          </span>
        </label>
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink tracking-[0.12em] uppercase hover:bg-ink/90 sm:w-auto"
      >
        {submitting ? t("formSubmitting") : t("formSubmit")}
      </Button>
    </form>
  );
}
