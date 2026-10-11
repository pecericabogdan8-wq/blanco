import { DM_Sans, Great_Vibes, Playfair_Display } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

/**
 * Page titles — high-contrast Didone (same family vibe as Blanco wordmark),
 * with Cyrillic. Italic matches the slanted logo look, but stays readable.
 */
const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Brand wordmark «Blanco» (Latin calligraphy, as in portfolio mock). */
const greatVibes = Great_Vibes({
  variable: "--font-script",
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
      className={`${dmSans.variable} ${playfair.variable} ${greatVibes.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
