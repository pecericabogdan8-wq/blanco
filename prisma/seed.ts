/**
 * Safe seed — NEVER wipes catalog data unless ALLOW_DESTRUCTIVE_SEED=1.
 *
 * Production boot: if products already exist → no-op (preserves admin edits).
 * Empty DB only: bootstrap from prisma/catalog-bootstrap.json (live snapshot).
 */
import { existsSync, readFileSync } from "fs";
import path from "path";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEMO_MENTIONS } from "../src/lib/demo-data";

const prisma = new PrismaClient();

type BootstrapProduct = {
  id: string;
  slug: string;
  sku?: string | null;
  name: string;
  nameUk?: string;
  category: string;
  description: string;
  descriptionUk?: string;
  details?: string[];
  detailsUk?: string[];
  price: number;
  salePrice?: number | null;
  figure?: string | null;
  figureUk?: string | null;
  featured?: boolean;
  newArrival?: boolean;
  tags?: string[];
  sizeChart?: unknown;
  images: string[];
  colors: { id: string; name: string; nameUk?: string; hex: string }[];
  sizes: string[];
  inventory: Record<string, number>;
};

function loadBootstrap(): BootstrapProduct[] {
  const file = path.join(__dirname, "catalog-bootstrap.json");
  if (!existsSync(file)) {
    throw new Error(
      "prisma/catalog-bootstrap.json missing — cannot bootstrap empty DB"
    );
  }
  const raw = JSON.parse(readFileSync(file, "utf8")) as {
    products: BootstrapProduct[];
  };
  if (!raw.products?.length) {
    throw new Error("catalog-bootstrap.json has no products");
  }
  return raw.products;
}

async function ensureUsers() {
  const ADMIN_PASSWORD = "bZ8pYGMej-KS9FE1!A7";
  const USER_PASSWORD = "8NOAdLi1zF2co0yD!A7";

  const admin = await prisma.user.findUnique({
    where: { email: "admin@blanco.ua" },
  });
  if (!admin) {
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: "admin@blanco.ua",
        name: "Blanco Admin",
        phone: "+380501112233",
        passwordHash: adminHash,
        role: Role.ADMIN,
        settings: JSON.stringify({ locale: "uk", newsletter: true }),
      },
    });
    console.log("Created admin@blanco.ua");
  }

  const demo = await prisma.user.findUnique({
    where: { email: "demo@blanco.ua" },
  });
  if (!demo) {
    const userHash = await bcrypt.hash(USER_PASSWORD, 12);
    await prisma.user.create({
      data: {
        email: "demo@blanco.ua",
        name: "Demo User",
        phone: "+380501112233",
        passwordHash: userHash,
        role: Role.USER,
        settings: JSON.stringify({ locale: "uk", newsletter: false }),
      },
    });
    console.log("Created demo@blanco.ua");
  }
}

async function ensureSettings() {
  const shipping = await prisma.siteSetting.findUnique({
    where: { key: "shipping" },
  });
  if (!shipping) {
    await prisma.siteSetting.create({
      data: {
        key: "shipping",
        value: JSON.stringify({
          freeFrom: 2500,
          flatRate: 99,
          carrier: "nova_poshta",
        }),
      },
    });
  }
  const store = await prisma.siteSetting.findUnique({ where: { key: "store" } });
  if (!store) {
    await prisma.siteSetting.create({
      data: {
        key: "store",
        value: JSON.stringify({
          name: "blanco",
          instagram: "https://www.instagram.com/blancoone/",
          telegram: "https://t.me/blancoone",
          email: "hello@blanco.ua",
        }),
      },
    });
  }
}

async function ensureMentions() {
  const count = await prisma.instagramMention.count();
  if (count > 0) return;
  for (let i = 0; i < DEMO_MENTIONS.length; i++) {
    const m = DEMO_MENTIONS[i];
    await prisma.instagramMention.create({
      data: {
        id: m.id,
        handle: m.handle,
        caption: m.caption,
        image: m.image,
        permalink: m.permalink ?? "https://www.instagram.com/blancoone/",
        sortOrder: i,
        active: true,
      },
    });
  }
}

async function seedProducts(products: BootstrapProduct[]) {
  for (const p of products) {
    const product = await prisma.product.create({
      data: {
        id: p.id,
        slug: p.slug,
        sku: p.sku?.trim() || null,
        name: p.name,
        nameUk: p.nameUk ?? "",
        category: p.category,
        description: p.description,
        descriptionUk: p.descriptionUk ?? "",
        details: JSON.stringify(p.details ?? []),
        detailsUk: JSON.stringify(p.detailsUk ?? []),
        price: p.price,
        salePrice: p.salePrice ?? null,
        figure: p.figure ?? null,
        figureUk: p.figureUk ?? null,
        featured: Boolean(p.featured),
        newArrival: Boolean(p.newArrival),
        tags: JSON.stringify(p.tags ?? []),
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

    const styleSku = (p.sku?.trim() || p.slug).toUpperCase();
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
          sku: `${styleSku}-${colorKey}-${size}`.toUpperCase(),
        },
      });
    }
  }
}

async function destructiveWipe() {
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
}

async function main() {
  const destructive = process.env.ALLOW_DESTRUCTIVE_SEED === "1";
  const productCount = await prisma.product.count();

  if (productCount > 0 && !destructive) {
    console.log(
      `Seed skipped: ${productCount} product(s) already in DB. Catalog will NOT be touched.`
    );
    await ensureUsers();
    await ensureSettings();
    await ensureMentions();
    return;
  }

  if (destructive) {
    console.warn(
      "ALLOW_DESTRUCTIVE_SEED=1 — wiping ALL catalog/users/orders before seed"
    );
    await destructiveWipe();
  }

  const products = loadBootstrap();
  console.log(`Bootstrapping ${products.length} products from catalog-bootstrap.json`);
  await seedProducts(products);
  await ensureUsers();
  await ensureSettings();
  await ensureMentions();
  console.log("Seed OK (bootstrap). Passwords → docs/owner-launch-guide.md");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
