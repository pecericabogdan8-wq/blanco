import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
async function main() {
  const products = await p.product.count();
  const images = await p.productImage.count();
  const active = await p.product.count({ where: { active: true } });
  const sample = await p.product.findMany({
    take: 3,
    include: { images: true, colors: true },
  });
  console.log({ products, active, images });
  console.log(
    sample.map((s) => ({
      id: s.id,
      name: s.name,
      imgCount: s.images.length,
      colors: s.colors.length,
    }))
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => p.$disconnect());
