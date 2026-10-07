import type { Metadata } from "next";
import { Outfit, Syne } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { SupportChat } from "@/components/support/support-chat";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const syne = Syne({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "blanco — светри з українськими діячами",
    template: "%s · blanco",
  },
  description:
    "Український бренд одягу blanco: светри з портретами історичних і культурних діячів, футболки та шарфи. Instagram @blancoone.",
  metadataBase: new URL("http://127.0.0.1:3847"),
  openGraph: {
    title: "blanco",
    description: "Светри з українськими діячами",
    locale: "uk_UA",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="uk"
      className={`${outfit.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <SupportChat />
        </Providers>
      </body>
    </html>
  );
}
