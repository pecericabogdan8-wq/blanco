"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { BlancoLogo } from "@/components/brand/blanco-logo";
import { InstagramIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M21.8 4.2 3.7 11.2c-1.2.5-1.2 1.2-.2 1.5l4.6 1.4 1.8 5.4c.2.7.4.9 1 .9.6 0 .9-.3 1.2-.6l2.5-2.4 5.2 3.8c1 .5 1.6.3 1.9-.9L23 5.6c.3-1.3-.5-1.9-1.2-1.4z" />
    </svg>
  );
}

export function SiteFooter() {
  const t = useTranslations("Footer");
  const tNav = useTranslations("Nav");
  const [email, setEmail] = useState("");

  type FooterLink =
    | {
        kind: "internal";
        href: "/sale" | "/catalog" | "/reviews" | "/returns" | "/account";
        label: string;
      }
    | { kind: "external"; href: string; label: string };

  const links: FooterLink[] = [
    { kind: "internal", href: "/sale", label: tNav("sale") },
    { kind: "internal", href: "/catalog", label: t("catalog") },
    { kind: "internal", href: "/reviews", label: t("reviews") },
    { kind: "internal", href: "/returns", label: t("shipping") },
    { kind: "internal", href: "/account", label: t("account") },
    {
      kind: "external",
      href: "https://www.instagram.com/blancoone/",
      label: t("contacts"),
    },
  ];

  const colA = links.slice(0, 3);
  const colB = links.slice(3);

  function FooterNavLink({ item }: { item: FooterLink }) {
    const className =
      "block text-[15px] leading-[1.35] text-foreground transition-opacity hover:opacity-55";
    if (item.kind === "external") {
      return (
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {item.label}
        </a>
      );
    }
    return (
      <Link href={item.href} className={className}>
        {item.label}
      </Link>
    );
  }

  function onSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    toast.message(t("subscribeSoon"));
    setEmail("");
  }

  const socials = (
    <div className="flex h-[1.35rem] items-center gap-3.5">
      <a
        href="https://www.instagram.com/blancoone/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground transition-opacity hover:opacity-55"
        aria-label="Instagram"
      >
        <InstagramIcon className="size-[1.125rem]" />
      </a>
      <a
        href="https://t.me/blancoone"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground transition-opacity hover:opacity-55"
        aria-label="Telegram"
      >
        <TelegramIcon className="size-[1.125rem]" />
      </a>
    </div>
  );

  const subscribeBlock = (
    <div>
      <div className="mb-4 flex h-[1.35rem] items-center justify-between gap-3">
        <p className="text-[12px] font-semibold leading-[1.35] tracking-[0.16em] uppercase">
          {t("subscribe")}
        </p>
        {socials}
      </div>
      <form onSubmit={onSubscribe} className="relative">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder")}
          className="h-9 w-full border-0 border-b border-foreground bg-transparent pr-9 text-sm outline-none placeholder:text-muted-foreground"
          autoComplete="email"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-0 -translate-y-1/2 p-1 text-foreground transition-opacity hover:opacity-55"
          aria-label={t("subscribe")}
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );

  const linkList = (items: FooterLink[]) => (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.href + item.label}>
          <FooterNavLink item={item} />
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="mt-auto border-t border-border bg-white">
      {/* Same horizontal inset as header (px-4 / sm:px-6) — equal L/R edges */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:pt-6 sm:pb-12 lg:pt-12 lg:pb-14">
        {/* Phone */}
        <div className="flex flex-col items-center sm:hidden">
          <Link href="/" className="inline-flex" aria-label="Blanco">
            <BlancoLogo markClassName="size-14" />
          </Link>
          <nav className="mt-10 flex w-full flex-col items-center gap-5">
            {links.map((item) => (
              <FooterNavLink key={item.href + item.label} item={item} />
            ))}
          </nav>
          <div className="mt-12 w-full max-w-sm border-t border-border pt-8">
            {subscribeBlock}
          </div>
        </div>

        {/* Medium: logo top-left, text row under — outer cols hug same side padding */}
        <div className="hidden sm:block lg:hidden">
          <Link href="/" className="mb-4 inline-flex leading-none" aria-label="Blanco">
            <BlancoLogo markClassName="size-10" />
          </Link>
          <div className="grid grid-cols-3 items-start gap-8 md:gap-10">
            <div className="justify-self-start">{linkList(colA)}</div>
            <div className="justify-self-start">{linkList(colB)}</div>
            <div className="min-w-0 justify-self-stretch">{subscribeBlock}</div>
          </div>
        </div>

        {/* Desktop: equal side inset; first & last columns flush to edges */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:items-start lg:gap-10 xl:gap-12">
          <div className="flex flex-col items-start gap-2.5 justify-self-start">
            <Link href="/" className="inline-flex leading-none" aria-label="Blanco">
              <BlancoLogo markClassName="size-[3.75rem]" />
            </Link>
            <p className="whitespace-nowrap text-[12px] leading-none text-muted-foreground">
              {t("rightsShort", { year: 2026 })}
            </p>
          </div>
          <div className="justify-self-start">{linkList(colA)}</div>
          <div className="justify-self-start">{linkList(colB)}</div>
          <div className="min-w-0 justify-self-stretch">{subscribeBlock}</div>
        </div>
      </div>
    </footer>
  );
}
