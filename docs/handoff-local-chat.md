# Blanco — handoff для локального Agent-чату

Прочитай цей файл і працюй **лише локально** в папці репо на ПК користувача. Не пропонуй Cloud Agent.

## Проєкт

- **Бренд:** blanco / @blancoone — український бренд светрів з портретами діячів (Шевченко, Стус, Кузьма, Леся тощо).
- **Ціль:** демо інтернет-магазину (каталог, PDP, кошик, wishlist, checkout mock, кабінет, адмінка, AI-чат підтримки).
- **Стек:** Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn/Base UI · zustand (localStorage).
- **Dev:** `npm run dev` → http://127.0.0.1:3847
- **Репо:** https://github.com/pecericabogdan8-wq/blanco (`main`)

## Демо-логін

- Email: `demo@blanco.ua`
- Пароль: `demo1234`

## Що вже зроблено

1. **Базовий shop** — сторінки: `/`, `/catalog`, `/product/[slug]`, `/cart`, `/checkout`, `/wishlist`, `/sale`, `/reviews`, `/returns`, auth, account, `/admin`, support chat.
2. **Реальні фото** з `items/` оптимізовані в `public/products/*.webp` і прив’язані до товарів.
3. **Каталог товарів (6):**
   - Shevchenko knitted sweater — 2500 грн
   - Stus knitted sweater — 2500 грн
   - Kuzma knitted sweater — 2500 грн
   - Lesya Ukrainka knitted sweater — 2500 грн
   - Kuzma Skryabin tee — 1800 грн
   - Freedom scarf — 1200 грн
4. **Стиль за `BlancoPortfolio.pdf`:** script logo Blanco (Great Vibes), білий shop floor, editorial hero з фотосесії, Selected products.
5. **Фікси:** hydration цін (`грн`), Base UI `nativeButton` для Link-кнопок, infinite loop на `/sale`, м’якші press-анімації.
6. Сирі фотосесії лишаються в `items/` (важкі JPG); для сайту використовуй `public/products/`.

## Важливі файли

- `src/lib/demo-data.ts` — товари, відгуки, FAQ
- `src/store/shop-store.ts` — кошик/wishlist/замовлення (persist `blanco-shop-v2`)
- `src/app/page.tsx` — головна
- `src/components/layout/site-header.tsx` — хедер
- `src/app/globals.css` — тема
- `BlancoPortfolio.pdf` — референс дизайну
- `items/` — сирі фото (не чіпати без потреби)

## Правила роботи

- Працювати в **одній гілці `main`** (користувач не хоче зайвих feature-гілок).
- UI: сучасний fashion shop, без generic AI-фіолетових тем / cream+terracotta кліше.
- Текст сайту може бути UK + EN (як у портфоліо); бренд-голос — спокійний, editorial.
- Після змін: `npm run dev`, перевірити в Chrome на :3847.

## Що робити далі (пріоритет)

1. `git pull` + `npm run dev` + смоук у Chrome.
2. Допиляти UX (швидкість, галереї, mobile).
3. Якщо треба — додати решту позицій з `items/` / портфоліо (Kostenko, Chornovil тощо), якщо знайдуться чіткі фото.
4. Не ламати mock checkout / admin без запиту.

## Стартова фраза для нового чату

> Прочитай `docs/handoff-local-chat.md`, зроби `git pull` і `npm run dev` на 3847, відкрий Chrome і підтверди що на сайті реальні фото + стиль Blanco з портфоліо.
