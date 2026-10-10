import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const [reviews, mentions] = await Promise.all([
  prisma.review.deleteMany(),
  prisma.instagramMention.deleteMany(),
]);

console.log(`deleted reviews=${reviews.count} mentions=${mentions.count}`);
await prisma.$disconnect();
