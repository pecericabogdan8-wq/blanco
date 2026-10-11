"use client";

import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { BlancoLogo } from "@/components/brand/blanco-logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: "/catalog" | "/sale" | "/reviews" | "/returns"; label: string };

export function MobileNav({
  items,
  isHome,
}: {
  items: NavItem[];
  isHome: boolean;
}) {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "nav-icon hover:bg-transparent",
          !isHome && "text-foreground"
        )}
        aria-label={t("menu")}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-[min(100%,20rem)] gap-0 bg-[#f6f5f2] p-0"
      >
        <SheetHeader className="border-b border-border px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <SheetTitle className="sr-only">{t("menu")}</SheetTitle>
            <Link href="/" onClick={() => setOpen(false)} aria-label={t("home")}>
              <BlancoLogo withWordmark markClassName="!size-7" />
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
        </SheetHeader>

        <nav className="flex flex-col px-2 py-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="hover-brand px-3 py-3.5 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-[#f0ebe4]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
