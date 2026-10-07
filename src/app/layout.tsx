import type { Metadata } from "next";
import { DM_Sans, Great_Vibes } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { SupportChatLazy } from "@/components/support/support-chat-lazy";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const greatVibes = Great_Vibes({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "blanco — knitted sweaters",
    template: "%s · blanco",
  },
  description:
    "Blanco — boutique clothing rooted in memory and unity. Knitted sweaters with portraits of those who shaped Ukraine. Instagram @blancoone.",
  metadataBase: new URL("http://127.0.0.1:3847"),
  openGraph: {
    title: "blanco",
    description: "Knitted sweaters. Memory on the chest.",
    locale: "uk_UA",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <SupportChatLazy />
        </Providers>
      </body>
    </html>
  );
}
