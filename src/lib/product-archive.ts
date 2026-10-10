import { prisma } from "@/lib/db";
import { productInclude } from "@/lib/product-mapper";

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
