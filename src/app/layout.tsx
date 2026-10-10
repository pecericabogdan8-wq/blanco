import { DM_Sans, Great_Vibes } from "next/font/google";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="uk"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${dmSans.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
