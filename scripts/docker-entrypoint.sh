#!/bin/sh
# Production entrypoint: persist DB + uploads on DATA_DIR (Railway volume).
# Never reseeds over existing catalog — see prisma/seed.ts.
set -eu

DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR/uploads/products"

# Persist uploaded photos across deploys
rm -rf /app/public/uploads
ln -sfn "$DATA_DIR/uploads" /app/public/uploads

export DATABASE_URL="${DATABASE_URL:-file:${DATA_DIR}/blanco.db}"
export DATA_DIR

echo "[blanco] DATA_DIR=$DATA_DIR"
echo "[blanco] DATABASE_URL=$DATABASE_URL"

npx prisma db push --skip-generate
npx tsx prisma/seed.ts

exec npx next start --port "${PORT:-3847}" --hostname 0.0.0.0
