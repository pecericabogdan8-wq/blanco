import { prisma } from "@/lib/db";
import { productInclude } from "@/lib/product-mapper";
import { reserveProductSkuSet } from "@/lib/sku";

/** Persist a full product snapshot before hard delete (backend recovery). */
export async function archiveProductBeforeDelete(
  productId: string,
  deletedBy?: string | null
) {
  const full = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });
  if (!full) return null;

  // Ban style + variant SKUs forever (even after row is gone)
  await reserveProductSkuSet(productId);

  return prisma.productArchive.create({
    data: {
      productId: full.id,
      slug: full.slug,
      name: full.name,
      nameUk: full.nameUk,
      snapshot: JSON.stringify(full),
      deletedBy: deletedBy ?? null,
    },
  });
}
