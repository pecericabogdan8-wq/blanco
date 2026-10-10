import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_PRODUCTS } from "../src/lib/demo-data";

const prisma = new PrismaClient();

async function main() {
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.session.deleteMany();
  await prisma.review.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productColor.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.instagramMention.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin@blanco.ua",
      name: "Blanco Admin",
      phone: "+380501112233",
      passwordHash,
      role: Role.ADMIN,
      settings: JSON.stringify({ locale: "uk", newsletter: true }),
    },
  });

  await prisma.user.create({
    data: {
      email: "demo@blanco.ua",
      name: "Demo User",
      phone: "+380501112233",
      passwordHash,
      role: Role.USER,
      settings: JSON.stringify({ locale: "uk", newsletter: false }),
    },
  });

  for (const p of DEMO_PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        name: p.name,
        nameUk: p.nameUk ?? "",
        category: p.category,
        description: p.description,
        descriptionUk: p.descriptionUk ?? "",
        details: JSON.stringify(p.details),
        detailsUk: JSON.stringify(p.detailsUk ?? []),
        price: p.price,
        salePrice: p.salePrice ?? null,
        figure: p.figure ?? null,
        figureUk: p.figureUk ?? null,
        featured: Boolean(p.featured),
        newArrival: Boolean(p.newArrival),
        tags: JSON.stringify(p.tags),
        sizeChart: p.sizeChart ? JSON.stringify(p.sizeChart) : null,
        active: true,
        images: {
          create: p.images.map((url, i) => ({
            url,
            sortOrder: i,
            alt: p.name,
          })),
        },
      },
    });

    const colorIdByKey = new Map<string, string>();
    for (let i = 0; i < p.colors.length; i++) {
      const c = p.colors[i];
      const row = await prisma.productColor.create({
        data: {
          productId: product.id,
          key: c.id,
          name: c.name,
          nameUk: c.nameUk ?? "",
          hex: c.hex,
          sortOrder: i,
        },
      });
      colorIdByKey.set(c.id, row.id);
    }

    for (const [key, qty] of Object.entries(p.inventory)) {
      const [colorKey, size] = key.split(":");
      const colorId = colorIdByKey.get(colorKey);
      if (!colorId) continue;
      await prisma.productVariant.create({
        data: {
          productId: product.id,
          colorId,
          size,
          stock: qty,
          sku: `${product.slug}-${colorKey}-${size}`.toUpperCase(),
        },
      });
    }
  }

  await prisma.product.update({
    where: { id: "p-kuzma-tee" },
    data: { salePrice: 1699 },
  });

  // Reviews & Instagram mentions: only real data via admin/API — never seeded demos

  await prisma.siteSetting.createMany({
    data: [
      {
        key: "shipping",
        value: JSON.stringify({
          freeFrom: 2500,
          flatRate: 99,
          carrier: "nova_poshta",
        }),
      },
      {
        key: "store",
        value: JSON.stringify({
          name: "blanco",
          instagram: "https://www.instagram.com/blancoone/",
          telegram: "https://t.me/blancoone",
          email: "hello@blanco.ua",
        }),
      },
    ],
  });

  console.log(
    "Seed OK. Admin:",
    admin.email,
    "/ demo@blanco.ua — password demo1234"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
