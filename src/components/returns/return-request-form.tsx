"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
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
import { FIELD_MSG, isBlank, isValidEmail, type FieldErrors } from "@/lib/form-field";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

/** Most common → rare; «Інше» last with free text. */
const REASONS = [
  "wrong_size",
  "quality_dislike",
  "defective",
  "other",
] as const;

export function ReturnRequestForm({ className }: { className?: string }) {
  const t = useTranslations("Returns");
  const searchParams = useSearchParams();
  const user = useShopStore((s) => s.user);
  const [orderId, setOrderId] = useState(
    () => searchParams.get("order") ?? ""
  );
  const [email, setEmail] = useState(() => user?.email ?? "");
  const [phone, setPhone] = useState(() => user?.phone ?? "");
  const [reason, setReason] = useState<string>("wrong_size");
  const [reasonOther, setReasonOther] = useState("");
  const [message, setMessage] = useState("");
  const [refundWanted, setRefundWanted] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (!user) return;
    setEmail((e) => e || user.email || "");
    setPhone((p) => p || user.phone || "");
  }, [user]);

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (isBlank(orderId)) next.orderId = FIELD_MSG.required;
    if (isBlank(email)) next.email = FIELD_MSG.required;
    else if (!isValidEmail(email)) next.email = FIELD_MSG.email;
    if (!reason) next.reason = FIELD_MSG.required;
    if (reason === "other" && isBlank(reasonOther)) {
      next.reasonOther = FIELD_MSG.required;
    }
    if (isBlank(message)) next.message = FIELD_MSG.required;
    else if (message.trim().length < 3) {
      next.message = t("formMessageTooShort");
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      const detail =
        reason === "other"
          ? `${reasonOther.trim()}${message.trim() ? `\n${message.trim()}` : ""}`
          : message.trim();
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          reason,
          message: detail,
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
      setReasonOther("");
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
      noValidate
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
            value={orderId}
            onChange={(e) => {
              setOrderId(e.target.value);
              clearError("orderId");
            }}
            placeholder={t("formOrderPlaceholder")}
            aria-invalid={Boolean(errors.orderId)}
            className="bg-white"
          />
          <FieldError message={errors.orderId} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="return-email">{t("formEmail")}</Label>
          <Input
            id="return-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
            }}
            placeholder={t("formEmailPlaceholder")}
            aria-invalid={Boolean(errors.email)}
            className="bg-white"
          />
          <FieldError message={errors.email} />
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
            onValueChange={(v) => {
              setReason(String(v ?? ""));
              clearError("reason");
              clearError("reasonOther");
            }}
          >
            <SelectTrigger
              className="w-full bg-white"
              aria-invalid={Boolean(errors.reason)}
            >
              <SelectValue>
                {(v) =>
                  t(
                    `reason_${String(v ?? "wrong_size")}` as "reason_defective"
                  )
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
          <FieldError message={errors.reason} />
        </div>
        {reason === "other" && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="return-reason-other">{t("formReasonOther")}</Label>
            <Input
              id="return-reason-other"
              value={reasonOther}
              onChange={(e) => {
                setReasonOther(e.target.value);
                clearError("reasonOther");
              }}
              placeholder={t("formReasonOtherPlaceholder")}
              aria-invalid={Boolean(errors.reasonOther)}
              className="bg-white"
            />
            <FieldError message={errors.reasonOther} />
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="return-message">{t("formMessage")}</Label>
          <Textarea
            id="return-message"
            rows={4}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              clearError("message");
            }}
            placeholder={t("formMessagePlaceholder")}
            aria-invalid={Boolean(errors.message)}
            className="bg-white"
          />
          <FieldError message={errors.message} />
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
