"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAQ_PATTERNS } from "@/lib/demo-data";
import type { ChatMessage } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

export function SupportChat() {
  const t = useTranslations("Support");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [pendingEscalate, setPendingEscalate] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const user = useShopStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const welcomeSet = useRef(false);

  useEffect(() => {
    if (welcomeSet.current) return;
    welcomeSet.current = true;
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        text: t("welcome"),
        ts: 0,
      },
    ]);
  }, [t]);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function answerFaq(text: string): string | null {
    for (const item of FAQ_PATTERNS) {
      if (item.q.test(text)) return t(item.key);
    }
    return null;
  }

  async function escalate(message: string) {
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || "anonymous@blanco.ua",
          message,
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.telegramSent ? t("escalatedTelegram") : t("escalatedDb"),
          ts: Date.now(),
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: t("escalateFail"),
          ts: Date.now(),
        },
      ]);
    }
    setPendingEscalate(false);
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: "user", text, ts: Date.now() },
    ]);

    if (
      pendingEscalate ||
      /оператор|людин|менеджер|telegram|operator|human|manager|agent|forward|передати/i.test(
        text
      )
    ) {
      if (!email.trim() && !pendingEscalate) {
        setPendingEscalate(true);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: t("needEmail"),
            ts: Date.now(),
          },
        ]);
        return;
      }
      await escalate(text);
      return;
    }

    const faq = answerFaq(text);
    await new Promise((r) => setTimeout(r, 400));
    if (faq) {
      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: "assistant", text: faq, ts: Date.now() },
      ]);
    } else {
      setPendingEscalate(true);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: t("noAnswer"),
          ts: Date.now(),
        },
      ]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "fixed right-3 bottom-3 z-40 flex size-11 items-center justify-center bg-ink text-mist shadow-lg transition duration-150 hover:bg-ink/90 active:scale-[0.98] sm:right-4 sm:bottom-4",
          open && "pointer-events-none opacity-0"
        )}
        aria-label={t("open")}
      >
        <MessageCircle className="size-5" />
      </button>

      {open && (
        <div className="fixed right-3 bottom-3 z-50 flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-lg border border-border bg-mist shadow-2xl sm:right-4 sm:bottom-4">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-mist">
            <div>
              <p className="font-display text-lg font-semibold">blanco help</p>
              <p className="text-[11px] text-mist/60">{t("subtitle")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("close")}>
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-ink text-mist"
                    : "bg-secondary text-foreground"
                )}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="space-y-2 border-t border-border p-3">
            {(pendingEscalate || !user) && (
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-sm"
              />
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("questionPlaceholder")}
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button size="icon" onClick={() => void send()} aria-label={t("send")}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
