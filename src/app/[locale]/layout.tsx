import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteChrome } from "@/components/layout/site-chrome";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import { SupportChatLazy } from "@/components/support/support-chat-lazy";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

function siteUrl(): URL {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.RAILWAY_PUBLIC_DOMAIN?.trim() ||
    "http://127.0.0.1:3847";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`);
  } catch {
    return new URL("http://127.0.0.1:3847");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: "uk", namespace: "Meta" });
  return {
    title: {
      default: t("title"),
      template: "%s · blanco",
    },
    description: t("description"),
    metadataBase: siteUrl(),
    icons: {
      icon: [{ url: "/favicon.png", type: "image/png" }],
      apple: [{ url: "/brand/logo-512.png" }],
    },
    openGraph: {
      title: "blanco",
      description: t("description"),
      locale: "uk_UA",
      type: "website",
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <SiteChrome />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <SupportChatLazy />
      </Providers>
    </NextIntlClientProvider>
  );
}
