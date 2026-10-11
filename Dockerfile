# Production image — persistent public host (Railway / Render / Fly), not a laptop tunnel.
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Bake local SQLite for demo share; swap to Postgres in real prod.
ENV DATABASE_URL="file:./prisma/dev.db"
RUN npx prisma generate \
  && npx prisma db push --skip-generate \
  && npm run db:seed \
  && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3847
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:./prisma/dev.db"

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/messages ./messages

EXPOSE 3847
CMD ["npx", "next", "start", "--port", "3847", "--hostname", "0.0.0.0"]
