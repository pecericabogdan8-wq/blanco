-- AlterTable
ALTER TABLE "InstagramMention" ADD COLUMN "permalink" TEXT NOT NULL DEFAULT '';
ALTER TABLE "InstagramMention" ADD COLUMN "externalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InstagramMention_externalId_key" ON "InstagramMention"("externalId");
