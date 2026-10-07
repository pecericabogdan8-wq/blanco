"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FAQ_ANSWERS } from "@/lib/demo-data";
import type { ChatMessage, SupportTicket } from "@/lib/types";
import { useShopStore } from "@/store/shop-store";
import { cn } from "@/lib/utils";

function answerFaq(text: string): string | null {
  for (const item of FAQ_ANSWERS) {
    if (item.q.test(text)) return item.a;
  }
  return null;
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [email, setEmail] = useState("");
  const [pendingEscalate, setPendingEscalate] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Привіт! Я AI-підтримка blanco. Запитайте про доставку, оплату, розміри чи повернення. Якщо не зможу допомогти — передам тікет у Telegram.",
      ts: 0,
    },
  ]);
  const addTicket = useShopStore((s) => s.addTicket);
  const user = useShopStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function escalate(message: string) {
    const ticket: SupportTicket = {
      id: `T-${Date.now()}`,
      createdAt: new Date().toISOString(),
      email: email.trim() || "anonymous@blanco.ua",
      message,
      status: "escalated",
      telegramSent: false,
    };

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: ticket.email,
          message: ticket.message,
          ticketId: ticket.id,
        }),
      });
      const data = await res.json();
      ticket.telegramSent = Boolean(data.telegramSent);
      addTicket(ticket);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: data.telegramSent
            ? "Передала ваше питання команді в Telegram. Відповімо на email якнайшвидше."
            : "Створила тікет (демо). Telegram не налаштовано — див. .env.example. Команда побачить запит в адмінці.",
          ts: Date.now(),
        },
      ]);
    } catch {
      addTicket(ticket);
      setMessages((m) => [
        ...m,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: "Тікет збережено локально. Спробуйте ще раз пізніше для відправки в Telegram.",
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

    if (pendingEscalate || /оператор|людин|менеджер|telegram/i.test(text)) {
      if (!email.trim() && !pendingEscalate) {
        setPendingEscalate(true);
        setMessages((m) => [
          ...m,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: "Залиште email у полі нижче й натисніть надіслати ще раз — передам тікет.",
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
          text: "Не знайшла точної відповіді. Можу передати питання команді в Telegram — вкажіть email і напишіть «передати» або повторіть питання.",
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
          "fixed right-4 bottom-4 z-50 flex items-center gap-2 bg-ink px-4 py-3 text-sm text-mist shadow-lg transition duration-150 hover:bg-ink/90 active:scale-[0.98]",
          open && "pointer-events-none opacity-0"
        )}
        aria-label="Відкрити підтримку"
      >
        <MessageCircle className="size-4" />
        Підтримка
      </button>

      {open && (
        <div className="fixed right-4 bottom-4 z-50 flex h-[min(520px,70vh)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-border bg-mist shadow-2xl">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-mist">
            <div>
              <p className="font-display text-lg font-semibold">blanco help</p>
              <p className="text-[11px] text-mist/60">AI · ескалація в Telegram</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрити">
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
                placeholder="Email для відповіді"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 text-sm"
              />
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ваше питання…"
                className="h-9"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button size="icon" onClick={() => void send()} aria-label="Надіслати">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
