import Link from "next/link";
import { InstagramIcon } from "@/components/icons";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/80 bg-ink text-mist">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-3xl font-bold tracking-tight">blanco</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-mist/70">
            Український бренд светрів з портретами історичних і культурних діячів.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-mist/50">Магазин</p>
          <ul className="space-y-2 text-sm text-mist/80">
            <li><Link href="/catalog" className="hover:text-mist">Каталог</Link></li>
            <li><Link href="/catalog?category=sweaters" className="hover:text-mist">Светри</Link></li>
            <li><Link href="/catalog?category=tshirts" className="hover:text-mist">Футболки</Link></li>
            <li><Link href="/catalog?category=scarves" className="hover:text-mist">Шарфи</Link></li>
            <li><Link href="/sale" className="hover:text-mist">Sale</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-mist/50">Допомога</p>
          <ul className="space-y-2 text-sm text-mist/80">
            <li><Link href="/returns" className="hover:text-mist">Повернення</Link></li>
            <li><Link href="/reviews" className="hover:text-mist">Відгуки</Link></li>
            <li><Link href="/account" className="hover:text-mist">Мій кабінет</Link></li>
            <li><Link href="/admin" className="hover:text-mist">Адмін</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.2em] uppercase text-mist/50">Соцмережі</p>
          <a
            href="https://www.instagram.com/blancoone/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-mist/80 hover:text-mist"
          >
            <InstagramIcon className="size-4" />
            @blancoone
          </a>
          <p className="mt-4 text-xs text-mist/50">
            Підтримка: напишіть у чат на сайті — AI відповість одразу, складні питання підуть у Telegram.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-mist/40 sm:px-6">
        © {new Date().getFullYear()} blanco · демо-магазин
      </div>
    </footer>
  );
}
