import Link from "next/link";
import { InstagramIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="flex items-end gap-6 md:col-span-1">
          <div className="size-16 shrink-0 rounded-full border border-foreground/20 bg-[radial-gradient(circle_at_30%_30%,#111_0%,transparent_55%),radial-gradient(circle_at_70%_70%,#6b2430_0%,transparent_50%)] opacity-80" />
          <p className="font-display text-5xl leading-none tracking-normal sm:text-6xl">Blanco</p>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Contact us</p>
          <a
            href="https://www.instagram.com/blancoone/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm hover:opacity-70"
          >
            <InstagramIcon className="size-4" />
            @blancoone
          </a>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">Follow us</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="https://www.instagram.com/blancoone/" target="_blank" rel="noopener noreferrer" className="hover:opacity-70">
                Instagram
              </a>
            </li>
            <li>
              <a href="https://t.me/" className="hover:opacity-70">
                Telegram
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.2em] text-muted-foreground uppercase">More info</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/catalog" className="hover:text-foreground">Shop</Link></li>
            <li><Link href="/returns" className="hover:text-foreground">Shipping & Returns</Link></li>
            <li><Link href="/reviews" className="hover:text-foreground">Reviews</Link></li>
            <li><Link href="/account" className="hover:text-foreground">Account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border px-4 py-4 text-center text-[11px] tracking-[0.16em] text-muted-foreground uppercase sm:px-6">
        2026 blancoone. All rights reserved.
      </div>
    </footer>
  );
}
