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
const bone = { id: "bone", name: "Молочний", hex: "#EDE8E1" };
const graphite = { id: "graphite", name: "Графіт", hex: "#3A3A3A" };
const ink = { id: "ink", name: "Чорнило", hex: "#1C2430" };
const moss = { id: "moss", name: "Мох", hex: "#3E4A3A" };
const clay = { id: "clay", name: "Глина", hex: "#8B6F5C" };

export const DEMO_PRODUCTS: Product[] = [
  {
    id: "p-shevchenko",
    slug: "sveter-shevchenko",
    name: "Светер «Шевченко»",
    category: "sweaters",
    figure: "Тарас Шевченко",
    description:
      "Оверсайз-светер з портретом Тараса Шевченка. М’яка бавовняна в’язка, щільний друк, силует, який тримає форму.",
    details: [
      "80% бавовна, 20% поліестер",
      "Оверсайз крій",
      "Прати при 30°C, вивернути навиворіт",
      "Зроблено в Україні",
    ],
    price: 2490,
    salePrice: 1990,
    colors: [black, bone, graphite],
    sizes: [...sweaterSizes],
    inventory: inv([black, bone, graphite], sweaterSizes, 10),
    images: [
      "/products/shevchenko-1.svg",
      "/products/shevchenko-2.svg",
      "/products/shevchenko-3.svg",
    ],
    featured: true,
    newArrival: true,
    tags: ["світильник", "портрет", "оверсайз"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-lesya",
    slug: "sveter-lesya-ukrainka",
    name: "Светер «Леся Українка»",
    category: "sweaters",
    figure: "Леся Українка",
    description:
      "Светер із силуетом Лесі Українки. Тихе, сильне висловлювання — без зайвого шуму.",
    details: [
      "Плотна трикотажна в’язка",
      "Принт на грудях",
      "Рекомендований догляд: делікатне прання",
      "Зроблено в Україні",
    ],
    price: 2490,
    colors: [ink, bone, moss],
    sizes: [...sweaterSizes],
    inventory: inv([ink, bone, moss], sweaterSizes, 7),
    images: [
      "/products/lesya-1.svg",
      "/products/lesya-2.svg",
    ],
    featured: true,
    tags: ["портрет", "жіноче"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-franko",
    slug: "sveter-franko",
    name: "Светер «Франко»",
    category: "sweaters",
    figure: "Іван Франко",
    description:
      "Класичний світер з портретом Івана Франка. Для тих, хто читає між рядків.",
    details: [
      "М’який фліс зсередини",
      "Не кошлатиться",
      "Унісекс",
      "Зроблено в Україні",
    ],
    price: 2390,
    colors: [black, clay],
    sizes: [...sweaterSizes],
    inventory: inv([black, clay], sweaterSizes, 6),
    images: ["/products/franko-1.svg", "/products/franko-2.svg"],
    featured: true,
    tags: ["портрет"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-skovoroda",
    slug: "sveter-skovoroda",
    name: "Светер «Сковорода»",
    category: "sweaters",
    figure: "Григорій Сковорода",
    description:
      "Філософський оверсайз з мінімалістичним портретом Сковороди. «Світ ловив мене — не спіймав».",
    details: [
      "Важка бавовна 340 gsm",
      "Вишивка-принт",
      "Вільний крій",
      "Зроблено в Україні",
    ],
    price: 2590,
    colors: [moss, bone, black],
    sizes: [...sweaterSizes],
    inventory: inv([moss, bone, black], sweaterSizes, 5),
    images: ["/products/skovoroda-1.svg", "/products/skovoroda-2.svg"],
    newArrival: true,
    tags: ["філософія", "оверсайз"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-bandera",
    slug: "sveter-bandera",
    name: "Светер «Бандера»",
    category: "sweaters",
    figure: "Степан Бандера",
    description:
      "Стриманий чорний світер з портретом Степана Бандери. Лаконічний графічний принт.",
    details: [
      "Щільна в’язка",
      "Принт водними фарбами",
      "Унісекс",
      "Зроблено в Україні",
    ],
    price: 2490,
    colors: [black, graphite],
    sizes: [...sweaterSizes],
    inventory: inv([black, graphite], sweaterSizes, 4),
    images: ["/products/bandera-1.svg", "/products/bandera-2.svg"],
    tags: ["портрет", "історія"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-stus",
    slug: "sveter-stus",
    name: "Светер «Стус»",
    category: "sweaters",
    figure: "Василь Стус",
    description:
      "Светер «Стус» — тиха сила слова. Графічний портрет на щільній бавовні.",
    details: [
      "Оверсайз",
      "М’який на дотик",
      "Непрозорий принт",
      "Зроблено в Україні",
    ],
    price: 2490,
    salePrice: 1890,
    colors: [ink, bone],
    sizes: [...sweaterSizes],
    inventory: inv([ink, bone], sweaterSizes, 9),
    images: ["/products/stus-1.svg", "/products/stus-2.svg"],
    tags: ["портрет", "розпродаж"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-tee-trizub",
    slug: "futbolka-trizub",
    name: "Футболка «Тризуб»",
    category: "tshirts",
    description:
      "Базова чорна футболка з мінімалістичним тризубом. Щоденний жест.",
    details: [
      "100% бавовна, 180 gsm",
      "Прямий крій",
      "Шовкотрафарет",
      "Зроблено в Україні",
    ],
    price: 990,
    colors: [black, bone],
    sizes: [...sweaterSizes],
    inventory: inv([black, bone], sweaterSizes, 15),
    images: ["/products/tee-trizub-1.svg", "/products/tee-trizub-2.svg"],
    newArrival: true,
    tags: ["базовий", "символ"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-tee-word",
    slug: "futbolka-slovo",
    name: "Футболка «Слово»",
    category: "tshirts",
    description:
      "Типографічна футболка з рядком Шевченка. Білий друк на чорному.",
    details: [
      "Преміум бавовна",
      "Щільний принт",
      "Унісекс",
      "Зроблено в Україні",
    ],
    price: 1090,
    salePrice: 890,
    colors: [black, graphite],
    sizes: [...sweaterSizes],
    inventory: inv([black, graphite], sweaterSizes, 12),
    images: ["/products/tee-slovo-1.svg", "/products/tee-slovo-2.svg"],
    tags: ["типографіка", "розпродаж"],
    sizeChart: sizeChartSweater,
  },
  {
    id: "p-scarf-line",
    slug: "sharf-linia",
    name: "Шарф «Лінія»",
    category: "scarves",
    description:
      "Довгий в’язаний шарф з тонкою контрастною лінією. Зима без шуму.",
    details: [
      "Акрил + вовна",
      "Довжина 180 см",
      "Унісекс",
      "Зроблено в Україні",
    ],
    price: 1290,
    colors: [black, bone, moss],
    sizes: [...scarfSizes],
    inventory: inv([black, bone, moss], scarfSizes, 20),
    images: ["/products/scarf-1.svg", "/products/scarf-2.svg"],
    featured: true,
    tags: ["аксесуар", "зима"],
  },
  {
    id: "p-scarf-portrait",
    slug: "sharf-portret",
    name: "Шарф «Портрет»",
    category: "scarves",
    description:
      "Шарф з вишитим контуром портрета. Теплий акцент до будь-якого образу.",
    details: [
      "М’яка суміш",
      "Вишивка на кінці",
      "Один розмір",
      "Зроблено в Україні",
    ],
    price: 1490,
    salePrice: 1190,
    colors: [graphite, clay],
    sizes: [...scarfSizes],
    inventory: inv([graphite, clay], scarfSizes, 8),
    images: ["/products/scarf-portrait-1.svg", "/products/scarf-portrait-2.svg"],
    tags: ["аксесуар", "розпродаж"],
  },
];

export const DEMO_REVIEWS: Review[] = [
  {
    id: "r1",
    productId: "p-shevchenko",
    author: "Олена",
    rating: 5,
    text: "Светер ідеальний — тканина м’яка, принт не тріскається після прання. Ношу майже щодня.",
    date: "2026-02-12",
    city: "Київ",
  },
  {
    id: "r2",
    productId: "p-lesya",
    author: "Марко",
    rating: 5,
    text: "Якісний оверсайз, сидить як треба. Дякую за Шевченка і Лесю в гардеробі.",
    date: "2026-01-28",
    city: "Львів",
  },
  {
    id: "r3",
    productId: "p-franko",
    author: "Ірина",
    rating: 4,
    text: "Дуже стильно. Єдине — замовляйте розмір уважніше, оверсайз справді великий.",
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
    productId: "p-scarf-line",
    author: "Софія",
    rating: 5,
    text: "Шарф теплий і не колеться. Колір «мох» — вогонь.",
    date: "2026-01-15",
    city: "Дніпро",
  },
];

export const DEMO_MENTIONS: InstagramMention[] = [
  {
    id: "m1",
    handle: "@olia.k",
    caption: "Мій Шевченко на щодень 🖤",
    image: "/products/mention-1.svg",
  },
  {
    id: "m2",
    handle: "@taras.fits",
    caption: "blancoone hit different",
    image: "/products/mention-2.svg",
  },
  {
    id: "m3",
    handle: "@masha.ua",
    caption: "Леся в молочному — любов",
    image: "/products/mention-3.svg",
  },
  {
    id: "m4",
    handle: "@street.kyiv",
    caption: "Локальний бренд, глобальний вайб",
    image: "/products/mention-4.svg",
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
