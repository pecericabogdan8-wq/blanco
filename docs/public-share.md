# Як дати людині стабільне посилання

Локальні тунелі (`loca.lt`, `localhost.run`, free Cloudflare quick tunnel) **ламаються**: IP-стіна, busy, `no tunnel`. Це не баг сайту — так працює безкоштовний проксі з ноутбука.

## Правильне рішення: хостинг у хмарі

У репо вже є:

- `Dockerfile` — збірка Next.js + SQLite demo DB
- `render.yaml` — Blueprint для [Render](https://dashboard.render.com)

### Кроки (один раз)

1. Закомітити й запушити код на GitHub (`origin`).
2. Зайти на https://dashboard.render.com → **New** → **Blueprint** → вибрати репо `blanco`.
3. Render збереже сервіс і видасть URL виду `https://blanco-xxxx.onrender.com`.
4. Цей URL можна кидати кому завгодно — **ПК не потрібен**.

### Альтернативи

- **Vercel** + Postgres (Neon) — краще для прод, треба змінити Prisma на `postgresql`.
- **Named Cloudflare Tunnel** + свій домен — якщо хочеш тримати сайт на своєму ПК 24/7.

## Тимчасово з ноутбука (не рекомендовано)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/public-share.ps1
```

Піднімає Cloudflare quick tunnel з авто-рестартом і пише URL у `share-url.txt`. Hostname змінюється після кожного рестарту.
