# Blanco — handoff (оновлено після backend)

Працюй **локально**. Dev: `npm run dev` → http://127.0.0.1:3847

## Стек зараз

- Next.js 16 + Prisma + **SQLite** (`prisma/dev.db`)
- Auth: cookie JWT + bcrypt (таблиці User / Session)
- Checkout пише Order + Payment (`payloadHash`) + зменшує ProductVariant.stock
- Адмінка `/admin` лише для `role=ADMIN`

## Акаунти (після `npm run db:seed`)

- `demo@blanco.ua` / `demo1234` — USER
- `admin@blanco.ua` / `demo1234` — ADMIN

## Команди

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Production: Postgres → змінити `provider` у `prisma/schema.prisma` + `DATABASE_URL`, потім `prisma migrate deploy`.

## Важливі шляхи

- `prisma/schema.prisma` — моделі
- `src/app/api/**` — REST API
- `src/lib/auth.ts` — сесії / хеші
- `src/store/shop-store.ts` — кошик (localStorage) + products з API
- `src/app/admin/page.tsx` — CRUD / склад / замовлення / тікети

## Env

Див. `.env.example`: `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, Telegram, Stripe/LiqPay stubs.
