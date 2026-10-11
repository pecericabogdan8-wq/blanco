import type {
  InstagramMention,
  Product,
  Review,
} from "@/lib/types";
import galleryManifest from "../../public/products/galleries/manifest.json";

function galleryImages(key: string, fallback: string[]): string[] {
  const entry = galleryManifest[key as keyof typeof galleryManifest];
  return entry?.images?.length ? entry.images : fallback;
}

const sweaterSizes = ["S", "M", "L"] as const;
const teeSizes = ["S", "M", "L", "XL"] as const;
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
  { size: "S" as const, length: "60", width: "58" },
  { size: "M" as const, length: "66", width: "64" },
  { size: "L" as const, length: "70", width: "68" },
];

const sizeChartTee = [
  { size: "S" as const, length: "66", width: "56" },
  { size: "M" as const, length: "68", width: "60" },
  { size: "L" as const, length: "70", width: "64" },
  { size: "XL" as const, length: "72", width: "66" },
];

const black = { id: "black", name: "Black", nameUk: "Чорний", hex: "#111111" };
const bone = { id: "bone", name: "Bone", nameUk: "Молочний", hex: "#E8E4DC" };
const burgundy = {
  id: "burgundy",
  name: "Burgundy",
  nameUk: "Бордо",
  hex: "#6B2430",
};
const coral = { id: "coral", name: "Coral", nameUk: "Корал", hex: "#D4786A" };
const blue = { id: "blue", name: "Blue", nameUk: "Синій", hex: "#1E3A5F" };
const white = { id: "white", name: "White", nameUk: "Білий", hex: "#F4F2EE" };

const knitDetails = [
  "Oversized knitted sweater",
  "Portrait print on front, text on back",
  "Wash at 30°C, inside out",
  "Made in Ukraine",
];

const knitDetailsUk = [
  "В’язаний оверсайз-светр",
  "Принт портрета спереду, текст ззаду",
  "Прати при 30°C, вивернути навиворіт",
  "Зроблено в Україні",
];

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p-shevchenko",
    slug: "shevchenko-knitted-sweater",
    name: "Shevchenko knitted sweater",
    nameUk: "Светр Шевченко",
    category: "sweaters",
    figure: "Taras Shevchenko",
    figureUk: "Тарас Шевченко",
    description:
      "Oversized knitted sweater with a portrait of Taras Shevchenko. Lines from “My Thoughts…” on the back.",
    descriptionUk:
      "В’язаний оверсайз-светр з портретом Тараса Шевченка. На спині — рядки з «Думи мої…».",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [bone],
    sizes: [...sweaterSizes],
    inventory: inv([bone], sweaterSizes, 10),
    images: galleryImages("shevchenko", ["/products/shevchenko-1.webp"]),
    featured: true,
    newArrival: true,
    tags: ["шевченко", "shevchenko", "портрет", "оверсайз"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-stus",
    slug: "stus-knitted-sweater",
    name: "Stus knitted sweater",
    nameUk: "Светр Стус",
    category: "sweaters",
    figure: "Vasyl Stus",
    figureUk: "Василь Стус",
    description:
      "Sweater with Vasyl Stus. On the back: “Endure, endure — endurance shapes you.”",
    descriptionUk:
      "Светр з портретом Василя Стуса. На спині — «Терпи, терпи — терпець тебе шліфує».",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [white],
    sizes: [...sweaterSizes],
    inventory: inv([white], sweaterSizes, 9),
    images: galleryImages("stus", ["/products/stus-1.webp"]),
    featured: true,
    tags: ["стус", "stus", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-kuzma",
    slug: "kuzma-knitted-sweater",
    name: "Kuzma knitted sweater",
    nameUk: "Светр Кузьма",
    category: "sweaters",
    figure: "Kuzma Skryabin",
    figureUk: "Кузьма Скрябін",
    description: "Black knitted sweater with Kuzma — red outline graphic.",
    descriptionUk:
      "Чорний в’язаний светр з портретом Кузьми — червона обводка в графіці.",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [black],
    sizes: [...sweaterSizes],
    inventory: inv([black], sweaterSizes, 8),
    images: galleryImages("kuzma", ["/products/kuzma-1.webp"]),
    featured: true,
    newArrival: true,
    tags: ["кузьма", "kuzma", "скрябін", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-lesya",
    slug: "lesya-ukrainka-knitted-sweater",
    name: "Lesya Ukrainka knitted sweater",
    nameUk: "Светр Леся Українка",
    category: "sweaters",
    figure: "Lesya Ukrainka",
    figureUk: "Леся Українка",
    description:
      "Coral knitted sweater with Lesya Ukrainka. On the back: “So as not to cry, I laughed.”",
    descriptionUk:
      "Кораловий в’язаний светр з портретом Лесі Українки. На спині — «Щоб не плакать, я сміялась.»",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [coral],
    sizes: [...sweaterSizes],
    inventory: inv([coral], sweaterSizes, 7),
    images: galleryImages("lesya", ["/products/lesya-1.webp"]),
    featured: true,
    tags: ["леся", "lesya", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-kuzma-tee",
    slug: "kuzma-skryabin-tee",
    name: "Kuzma Skryabin tee",
    nameUk: "Футболка Кузьма Скрябін",
    category: "tshirts",
    figure: "Kuzma Skryabin",
    figureUk: "Кузьма Скрябін",
    description:
      "Oversized tee with KUZMA / Skryabin graphic. Hand-style text on the back.",
    descriptionUk:
      "Оверсайз-футболка з графікою KUZMA / Скрябін. На спині — текст у рукописному стилі.",
    details: [
      "Oversized fit",
      "100% cotton · ~200 g/m²",
      "DTF print · washed look",
      "Wash at 30°C, inside out",
      "Made in Ukraine",
    ],
    detailsUk: [
      "Оверсайз крій",
      "100% бавовна · щільність ~200 г/м²",
      "Друк DTF · washed-ефект",
      "Прати при 30°C, вивернути навиворіт",
      "Зроблено в Україні",
    ],
    price: 1999,
    colors: [black],
    sizes: [...teeSizes],
    inventory: inv([black], teeSizes, 12),
    images: galleryImages("kuzma-tee", ["/products/kuzma-tee-1.webp"]),
    newArrival: true,
    tags: ["кузьма", "футболка", "tee", "скрябін"],
    sizeChart: sizeChartTee,
  },
  {
    id: "p-volya-scarf",
    slug: "freedom-scarf",
    name: "Freedom scarf",
    nameUk: "Шарф Воля",
    category: "scarves",
    description:
      "Knitted “ВОЛЯ” (Freedom) scarf with black graphics on a light ground.",
    descriptionUk:
      "В’язаний шарф «ВОЛЯ» з чорною графікою на світлому тлі. Теплий акцент колекції.",
    details: [
      "Knitted accessory",
      "“ВОЛЯ” print and icons",
      "One size",
      "Made in Ukraine",
    ],
    detailsUk: [
      "В’язаний аксесуар",
      "Принт «ВОЛЯ» та іконки",
      "Один розмір",
      "Зроблено в Україні",
    ],
    price: 1200,
    colors: [bone],
    sizes: [...scarfSizes],
    inventory: inv([bone], scarfSizes, 20),
    images: galleryImages("freedom-scarf", ["/products/volya-scarf-1.webp"]),
    featured: true,
    tags: ["воля", "freedom", "шарф", "scarf"],
  },
  {
    id: "p-chornovil",
    slug: "chornovil-knitted-sweater",
    name: "Chornovil knitted sweater",
    nameUk: "Светр Чорновіл",
    category: "sweaters",
    figure: "Vyacheslav Chornovil",
    figureUk: "В’ячеслав Чорновіл",
    description: "Red oversized knitted sweater with Vyacheslav Chornovil.",
    descriptionUk:
      "Червоний в’язаний оверсайз-светр з портретом В’ячеслава Чорновола.",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [burgundy],
    sizes: [...sweaterSizes],
    inventory: inv([burgundy], sweaterSizes, 6),
    images: galleryImages("chornovil", ["/products/galleries/chornovil/01.jpg"]),
    featured: true,
    tags: ["чорновіл", "chornovil", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-kostenko",
    slug: "kostenko-knitted-sweater",
    name: "Kostenko knitted sweater",
    nameUk: "Светр Костенко",
    category: "sweaters",
    figure: "Lina Kostenko",
    figureUk: "Ліна Костенко",
    description:
      "Black knitted sweater with a white outline portrait of Lina Kostenko.",
    descriptionUk:
      "Чорний в’язаний светр з білою обводкою портрета Ліни Костенко.",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [black],
    sizes: [...sweaterSizes],
    inventory: inv([black], sweaterSizes, 6),
    images: galleryImages("kostenko", ["/products/galleries/kostenko/01.jpg"]),
    featured: true,
    newArrival: true,
    tags: ["костенко", "kostenko", "портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-lobanovskyi",
    slug: "lobanovskyi-knitted-sweater",
    name: "Lobanovskyi knitted sweater",
    nameUk: "Светр Лобановський",
    category: "sweaters",
    figure: "Valeriy Lobanovskyi",
    figureUk: "Валерій Лобановський",
    description: "Blue oversized knitted sweater with Valeriy Lobanovskyi.",
    descriptionUk:
      "Синій в’язаний оверсайз-светр з портретом Валерія Лобановського.",
    details: knitDetails,
    detailsUk: knitDetailsUk,
    price: 3000,
    colors: [blue],
    sizes: [...sweaterSizes],
    inventory: inv([blue], sweaterSizes, 5),
    images: galleryImages("lobanovskyi", [
      "/products/galleries/lobanovskyi/01.jpg",
    ]),
    featured: true,
    newArrival: true,
    tags: ["лобановський", "lobanovskyi", "портрет"],
    sizeChart: sizeChartSweater,
  },
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "p-shevchenko",
    author: "Олена",
    rating: 5,
    text: "Светр ідеальний — тканина м’яка, принт тримається. Ношу майже щодня.",
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

/** Admin / legacy UA labels — prefer next-intl Categories in storefront */
export const CATEGORY_LABELS: Record<string, string> = {
  sweaters: "Светри",
  tshirts: "Футболки",
  scarves: "Шарфи",
  all: "Весь товар",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  placed: "Оформлено",
  paid: "Оплачено",
  processing: "В обробці",
  shipped: "Відправлено",
  delivered: "Доставлено",
  returned: "Повернення",
  cancelled: "Скасовано",
};

/** Status chip colors (admin + account) */
export const ORDER_STATUS_STYLE: Record<
  string,
  { dot: string; chip: string }
> = {
  placed: { dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-800" },
  paid: { dot: "bg-indigo-500", chip: "bg-indigo-500/10 text-indigo-800" },
  processing: { dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-900" },
  shipped: { dot: "bg-violet-500", chip: "bg-violet-500/10 text-violet-800" },
  delivered: {
    dot: "bg-emerald-600",
    chip: "bg-emerald-600/10 text-emerald-800",
  },
  returned: { dot: "bg-orange-500", chip: "bg-orange-500/10 text-orange-900" },
  cancelled: { dot: "bg-[#9b1c1c]", chip: "bg-[#9b1c1c]/10 text-[#9b1c1c]" },
};

/** FAQ matchers → Support message keys (answers live in messages/*.json) */
export const FAQ_PATTERNS: {
  q: RegExp;
  key:
    | "faqShipping"
    | "faqPayment"
    | "faqReturns"
    | "faqSize"
    | "faqCare"
    | "faqContact";
}[] = [
  { q: /доставк|нова\s*пошт|скільки\s*їде|shipping|delivery|nova\s*poshta/i, key: "faqShipping" },
  { q: /оплат|картк|apple|google\s*pay|stripe|payment|card|pay/i, key: "faqPayment" },
  { q: /поверн|обмін|return|refund|exchange/i, key: "faqReturns" },
  { q: /розмір|size|сітк|таблиц|fit|sizing/i, key: "faqSize" },
  { q: /догляд|прат|прання|wash|care|laundry/i, key: "faqCare" },
  { q: /контакт|телеграм|instagram|написати|contact|telegram|write/i, key: "faqContact" },
];
