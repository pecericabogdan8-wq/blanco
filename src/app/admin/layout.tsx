import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/providers";

/** Admin is outside [locale]; force Ukrainian UI strings. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  setRequestLocale("uk");
  const messages = await getMessages({ locale: "uk" });

  return (
    <NextIntlClientProvider locale="uk" messages={messages}>
      <Providers>
        <main className="min-h-full flex-1">{children}</main>
      </Providers>
    </NextIntlClientProvider>
  );
}
