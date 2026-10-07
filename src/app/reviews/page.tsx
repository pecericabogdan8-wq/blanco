import Image from "next/image";
import { DEMO_MENTIONS, DEMO_REVIEWS } from "@/lib/demo-data";

export const metadata = {
  title: "Відгуки",
  description: "Відгуки покупців blanco та Instagram-відмітки",
};

export default function ReviewsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-display text-4xl font-bold tracking-tight">Відгуки</h1>
      <p className="mt-2 text-muted-foreground">Що кажуть ті, хто вже носить blanco</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DEMO_REVIEWS.map((r) => (
          <blockquote
            key={r.id}
            className="border border-border bg-mist/40 p-6"
          >
            <p className="text-sm tracking-widest text-muted-foreground">
              {"★".repeat(r.rating)}
              {"☆".repeat(5 - r.rating)}
            </p>
            <p className="mt-3 leading-relaxed">{r.text}</p>
            <footer className="mt-4 text-sm text-muted-foreground">
              {r.author}, {r.city} · {r.date}
            </footer>
          </blockquote>
        ))}
      </div>

      <section className="mt-20">
        <h2 className="font-display text-3xl font-bold">Instagram mentions</h2>
        <p className="mt-2 text-muted-foreground">
          Відмітки з{" "}
          <a
            href="https://www.instagram.com/blancoone/"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            @blancoone
          </a>
        </p>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          {DEMO_MENTIONS.map((m) => (
            <a
              key={m.id}
              href="https://www.instagram.com/blancoone/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative aspect-square overflow-hidden bg-mist"
            >
              <Image
                src={m.image}
                alt={m.handle}
                fill
                className="object-cover transition duration-500 group-hover:scale-105"
                sizes="25vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-3 text-xs text-white">
                <p className="font-medium">{m.handle}</p>
                <p className="text-white/70">{m.caption}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
