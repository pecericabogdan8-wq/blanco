# blanco — інтернет-магазин

Український бренд одягу [blanco](https://www.instagram.com/blancoone/): светри з портретами, футболки, шарфи.

## Стек

- **Frontend:** Next.js 16 · React 19 · TypeScript · Tailwind 4 · shadcn
- **Backend:** Next.js Route Handlers (API)
- **БД:** Prisma + **SQLite** локально (`prisma/dev.db`); для сервера — PostgreSQL (змініть `provider` у `schema.prisma` + `DATABASE_URL`)
- **Auth:** httpOnly cookie + JWT (jose) + bcrypt паролі в БД
- **Оплата:** запис у таблицю `Payment` з `payloadHash`; mock / stub Stripe|LiqPay за env

## Швидкий старт

```bash
npm install
cp .env.example .env   # вже може бути
npx prisma migrate dev
npm run db:seed
npm run dev
```

Сайт: http://127.0.0.1:3847

### Акаунти після seed

| Email | Пароль | Роль |
|-------|--------|------|
| `demo@blanco.ua` | `demo1234` | USER |
| `admin@blanco.ua` | `demo1234` | ADMIN |

Адмінка: `/admin` (потрібен логін ADMIN).

## Що в базі

Users (+ settings JSON), Sessions, Products, Colors, Variants (розмір×колір×сток), Orders, OrderItems, Payments (hash), Wishlist, Reviews, SupportTickets, SiteSettings, InstagramMentions.

Кошик гостя — у `localStorage` (`blanco-cart-v3`); checkout створює замовлення + оплату + зменшує сток у транзакції.

## Production (на сервер)

1. PostgreSQL і `DATABASE_URL=postgresql://...`
2. У `prisma/schema.prisma` → `provider = "postgresql"`
3. `npx prisma migrate deploy && npm run db:seed` (або без seed)
4. Змініть `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`
5. За бажанням: Stripe / LiqPay / Telegram env
6. `npm run build && npm run start`

## Скрипти

| Команда | Опис |
|---------|------|
| `npm run dev` | Dev :3847 |
| `npm run build` | Production build |
| `npm run db:seed` | Seed каталогу + юзерів |
| `npm run db:reset` | Reset міграцій + seed |
