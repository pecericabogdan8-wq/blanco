# blanco — інтернет-магазин

Демо-сайт українського бренду одягу [blanco](https://www.instagram.com/blancoone/): светри з портретами історичних і культурних діячів, футболки та шарфи.

Стек: **Next.js · TypeScript · Tailwind CSS · shadcn/ui**. Дані, кошик, wishlist, замовлення та адмінка зберігаються локально в браузері (demo). Реальні фото й ціни можна підставити пізніше.

## Запуск

```bash
npm install
npm run dev
```

Сайт: [http://127.0.0.1:3847](http://127.0.0.1:3847)

Опційні секрети — скопіюйте `.env.example` → `.env.local` (Telegram для ескалації тікетів, Stripe test). Без них усе працює в mock-режимі.

## Демо-акаунт

- Email: `demo@blanco.ua`
- Пароль: `demo1234`

## Що є на сайті

**Публічно:** головна, каталог (фільтри + пошук), картка товару, кошик, wishlist, checkout (картка / Apple Pay / Google Pay), sale, відгуки + Instagram mentions, повернення, логін/реєстрація/кабінет, AI-чат підтримки.

**Адмін** (`/admin`): замовлення зі статусами, CRUD товарів, склад за кольором/розміром, тікети підтримки.

## Скрипти

| Команда        | Опис                |
|----------------|---------------------|
| `npm run dev`  | Dev-сервер :3847    |
| `npm run build`| Production build    |
| `npm run start`| Production :3847    |
| `npm run lint` | ESLint              |
