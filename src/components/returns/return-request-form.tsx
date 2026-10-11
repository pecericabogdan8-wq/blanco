"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
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

const REASONS = [
  "defective",
  "quality_dislike",
  "wrong_size",
  "other",
] as const;

export function ReturnRequestForm() {
  const t = useTranslations("Returns");
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(
    () => searchParams.get("order") ?? ""
  );
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState<string>("quality_dislike");
  const [message, setMessage] = useState("");
  const [refundWanted, setRefundWanted] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
      toast.success(t("formSuccess"));
      setMessage("");
    } catch {
      toast.error(t("formError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      id="zayavka"
      onSubmit={handleSubmit}
      className="scroll-mt-24 space-y-4 border border-border bg-white p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold tracking-wide text-foreground uppercase">
        {t("formTitle")}
      </h2>
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
            placeholder="BL-…"
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
            className="bg-white"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>{t("formReason")}</Label>
          <Select value={reason} onValueChange={(v) => setReason(String(v ?? ""))}>
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
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
            className="bg-white"
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 sm:col-span-2">
          <input
            type="checkbox"
            checked={refundWanted}
            onChange={(e) => setRefundWanted(e.target.checked)}
            className="mt-1 size-4 border-border"
          />
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
