"use client";

import { usePathname } from "@/i18n/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { cn } from "@/lib/utils";

export function SiteChrome() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div
      className={cn(
        "z-50 w-full",
        isHome ? "absolute inset-x-0 top-0" : "sticky top-0"
      )}
    >
      <SiteHeader />
    </div>
  );
}
