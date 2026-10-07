import type {
  InstagramMention,
  Product,
  Review,
} from "@/lib/types";

const sweaterSizes = ["S", "M", "L", "XL"] as const;
const scarfSizes = ["ONE"] as const;

function inv(
  colors: { id: string }[],
  sizes: readonly string[],
  qty = 8
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of colors) {
    for (const s of sizes) {
      out[`${c.id}:${s}`] = qty;
    }
  }
  return out;
}

const sizeChartSweater = [
  { size: "S" as const, chest: "96–100", length: "66", sleeve: "62" },
  { size: "M" as const, chest: "100–104", length: "68", sleeve: "63" },
  { size: "L" as const, chest: "104–110", length: "70", sleeve: "64" },
  { size: "XL" as const, chest: "110–116", length: "72", sleeve: "65" },
];

const black = { id: "black", name: "Чорний", hex: "#111111" };
const bone = { id: "bone", name: "Молочний", hex: "#E8E4DC" };
const grey = { id: "grey", name: "Сірий", hex: "#B8B6B1" };
const burgundy = { id: "burgundy", name: "Бордо", hex: "#6B2430" };

const knitDetails = [
  "В’язаний оверсайз-светер",
  "Принт портрета спереду, текст ззаду",
  "Прати при 30°C, вивернути навиворіт",
  "Зроблено в Україні",
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p-shevchenko",
    slug: "shevchenko-knitted-sweater",
    name: "Shevchenko knitted sweater",
    category: "sweaters",
    figure: "Тарас Шевченко",
    description:
      "В’язаний оверсайз-светер з портретом Тараса Шевченка. На спині — рядки з «Думи мої…».",
    details: knitDetails,
    price: 2500,
    colors: [bone, grey, burgundy],
    sizes: [...sweaterSizes],
    inventory: inv([bone, grey, burgundy], sweaterSizes, 10),
    images: [
      "/products/shevchenko-1.webp",
      "/products/shevchenko-8.webp",
      "/products/shevchenko-2.webp",
      "/products/shevchenko-3.webp",
      "/products/shevchenko-9.webp",
      "/products/shevchenko-10.webp",
      "/products/shevchenko-5.webp",
      "/products/shevchenko-6.webp",
    ],
    featured: true,
    newArrival: true,
    tags: ["шевченко", "портрет", "оверсайз"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-stus",
    slug: "stus-knitted-sweater",
    name: "Stus knitted sweater",
    category: "sweaters",
    figure: "Василь Стус",
    description:
      "Светер з портретом Василя Стуса. На спині — «Терпи, терпи — терпець тебе шліфує».",
    details: knitDetails,
    price: 2500,
    colors: [bone, grey, burgundy, black],
    sizes: [...sweaterSizes],
    inventory: inv([bone, grey, burgundy, black], sweaterSizes, 9),
    images: [
      "/products/stus-1.webp",
      "/products/stus-8.webp",
      "/products/stus-2.webp",
      "/products/stus-3.webp",
      "/products/stus-9.webp",
      "/products/stus-10.webp",
      "/products/stus-11.webp",
      "/products/stus-burgundy-1.webp",
      "/products/stus-burgundy-2.webp",
    ],
    featured: true,
    tags: ["стус", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-kuzma",
    slug: "kuzma-knitted-sweater",
    name: "Kuzma knitted sweater",
    category: "sweaters",
    figure: "Кузьма Скрябін",
    description:
      "Чорний в’язаний светер з експресивним портретом Кузьми — червоний, білий і чорний графічний принт.",
    details: knitDetails,
    price: 2500,
    colors: [black],
    sizes: [...sweaterSizes],
    inventory: inv([black], sweaterSizes, 8),
    images: [
      "/products/kuzma-1.webp",
      "/products/kuzma-2.webp",
      "/products/kuzma-3.webp",
      "/products/kuzma-4.webp",
      "/products/kuzma-5.webp",
      "/products/kuzma-6.webp",
    ],
    featured: true,
    newArrival: true,
    tags: ["кузьма", "скрябін", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-lesya",
    slug: "lesya-ukrainka-knitted-sweater",
    name: "Lesya Ukrainka knitted sweater",
    category: "sweaters",
    figure: "Леся Українка",
    description:
      "Чорний светер з портретом Лесі Українки. Тихе, сильне висловлювання — без зайвого шуму.",
    details: knitDetails,
    price: 2500,
    colors: [black, burgundy],
    sizes: [...sweaterSizes],
    inventory: inv([black, burgundy], sweaterSizes, 7),
    images: [
      "/products/lesya-1.webp",
      "/products/lesya-3.webp",
      "/products/lesya-2.webp",
      "/products/lesya-4.webp",
      "/products/lesya-5.webp",
      "/products/lesya-6.webp",
    ],
    featured: true,
    tags: ["леся", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-kuzma-tee",
    slug: "kuzma-skryabin-tee",
    name: "Kuzma Skryabin tee",
    category: "tshirts",
    figure: "Кузьма Скрябін",
    description:
      "Оверсайз-футболка з графікою KUZMA / Скрябін. На спині — текст у рукописному стилі.",
    details: [
      "Оверсайз крій",
      "Принт спереду і ззаду",
      "Прати при 30°C",
      "Зроблено в Україні",
    ],
    price: 1800,
    colors: [black],
    sizes: [...sweaterSizes],
    inventory: inv([black], sweaterSizes, 12),
    images: [
      "/products/kuzma-tee-1.webp",
      "/products/kuzma-tee-2.webp",
      "/products/kuzma-tee-3.webp",
      "/products/kuzma-tee-4.webp",
      "/products/kuzma-tee-5.webp",
    ],
    newArrival: true,
    tags: ["кузьма", "футболка"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-volya-scarf",
    slug: "freedom-scarf",
    name: "Freedom scarf",
    category: "scarves",
    description:
      "В’язаний шарф «ВОЛЯ» з чорною графікою на світлому тлі. Теплий акцент колекції.",
    details: [
      "В’язаний аксесуар",
      "Принт «ВОЛЯ» та іконки",
      "Один розмір",
      "Зроблено в Україні",
    ],
    price: 1200,
    colors: [bone],
    sizes: [...scarfSizes],
    inventory: inv([bone], scarfSizes, 20),
    images: [
      "/products/volya-scarf-1.webp",
      "/products/volya-scarf-2.webp",
      "/products/volya-scarf-3.webp",
      "/products/volya-scarf-4.webp",
    ],
    featured: true,
    tags: ["воля", "шарф", "аксесуар"],
  },
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "p-shevchenko",
    author: "Олена",
    rating: 5,
    text: "Светер ідеальний — тканина м’яка, принт тримається. Ношу майже щодня.",
    date: "2026-02-12",
    city: "Київ",
  },
  {
    id: "r2",
    productId: "p-lesya",
    author: "Марко",
    rating: 5,
    text: "Якісний оверсайз, сидить як треба. Дякую за Лесю в гардеробі.",
    date: "2026-01-28",
    city: "Львів",
  },
  {
    id: "r3",
    productId: "p-kuzma",
    author: "Ірина",
    rating: 5,
    text: "Кузьма виглядає потужно. Фотосесія на сайті — вау.",
    date: "2026-03-03",
    city: "Одеса",
  },
  {
    id: "r4",
    author: "Андрій",
    rating: 5,
    text: "Доставка швидка, пакування охайне. Підтримую український бренд.",
    date: "2026-02-20",
    city: "Харків",
  },
  {
    id: "r5",
    productId: "p-volya-scarf",
    author: "Софія",
    rating: 5,
    text: "Шарф «Воля» — теплий і з характером.",
    date: "2026-01-15",
    city: "Дніпро",
  },
];

export const DEMO_MENTIONS: InstagramMention[] = [
  {
    id: "m1",
    handle: "@olia.k",
    caption: "Мій Шевченко на щодень",
    image: "/products/mentions-1.webp",
  },
  {
    id: "m2",
    handle: "@taras.fits",
    caption: "blancoone hit different",
    image: "/products/mentions-2.webp",
  },
  {
    id: "m3",
    handle: "@masha.ua",
    caption: "Стус у студії",
    image: "/products/mentions-3.webp",
  },
  {
    id: "m4",
    handle: "@street.kyiv",
    caption: "Локальний бренд, сильний вайб",
    image: "/products/mentions-4.webp",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  sweaters: "Светри",
  tshirts: "Футболки",
  scarves: "Шарфи",
  all: "Усе",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Оформлено",
  paid: "Оплачено",
  processing: "В обробці",
  shipped: "Відправлено",
  delivered: "Доставлено",
  cancelled: "Скасовано",
};

export const FAQ_ANSWERS: { q: RegExp; a: string }[] = [
  {
    q: /доставк|нова\s*пошт|скільки\s*їде|shipping/i,
    a: "Доставка Новою Поштою по Україні — 1–3 дні після відправки. Відправка протягом 1–2 робочих днів після оплати.",
  },
  {
    q: /оплат|картк|apple|google\s*pay|stripe/i,
    a: "Приймаємо картку Visa/Mastercard, Apple Pay та Google Pay. Оплата безпечна (демо-режим на сайті).",
  },
  {
    q: /поверн|обмін|return|refund/i,
    a: "Повернення протягом 14 днів, якщо річ без слідів носіння й зі збереженими бирками. Деталі — на сторінці «Повернення».",
  },
  {
    q: /розмір|size|сітк|таблиц/i,
    a: "На кожній картці товару є таблиця розмірів. Светри — оверсайз: якщо хочете щільніше, беріть розмір менше.",
  },
  {
    q: /догляд|прат|прання|wash/i,
    a: "Прати при 30°C, вивернути навиворіт, без відбілювача. Не сушити в барабані на високій температурі.",
  },
  {
    q: /контакт|телеграм|instagram|написати/i,
    a: "Instagram: @blancoone. Якщо питання складне — залиште email, і я передам тікет у Telegram команді.",
  },
];
