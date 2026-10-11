import { prisma } from "@/lib/db";

const CAT_CODE: Record<string, string> = {
  sweaters: "SW",
  tshirts: "TS",
  scarves: "SC",
};

/** Smash-style article: BL-SW-001 — auto when admin leaves SKU empty. */
export async function allocateProductSku(
  category: string,
  preferred?: string | null
): Promise<string> {
  const manual = preferred?.trim().toUpperCase();
  if (manual) {
    const clash = await prisma.product.findFirst({
      where: { sku: manual },
      select: { id: true },
    });
    if (clash) throw new Error(`Артикул «${manual}» уже зайнятий`);
    return manual;
  }

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
