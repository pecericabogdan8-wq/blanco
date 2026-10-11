import { PrismaClient } from "@prisma/client";

const CAT_CODE = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

const prisma = new PrismaClient();

async function allocate(category) {
  const code = CAT_CODE[category] ?? "XX";
  const prefix = `BL-${code}-`;
  const existing = await prisma.product.findMany({
    where: { sku: { startsWith: prefix } },
    select: { sku: true },
  });
  let max = 0;
  for (const row of existing) {
    const n = Number(row.sku?.slice(prefix.length));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const missing = await prisma.product.findMany({
  where: { OR: [{ sku: null }, { sku: "" }] },
  select: { id: true, category: true, slug: true },
  orderBy: { createdAt: "asc" },
});

for (const p of missing) {
  const sku = await allocate(p.category);
  await prisma.product.update({ where: { id: p.id }, data: { sku } });
  console.log(`${p.slug} → ${sku}`);
}

console.log(`Done: ${missing.length} products`);
await prisma.$disconnect();
