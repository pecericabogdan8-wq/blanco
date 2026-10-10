import { defineRouting } from "next-intl/routing";

/** Single-language storefront: Ukrainian only. */
export const routing = defineRouting({
  locales: ["uk"],
  defaultLocale: "uk",
  localePrefix: "always",
  localeDetection: false,
  localeCookie: false,
});

export type AppLocale = (typeof routing.locales)[number];
