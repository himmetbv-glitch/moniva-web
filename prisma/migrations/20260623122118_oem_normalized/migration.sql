-- AlterTable
ALTER TABLE "OemReference" ADD COLUMN     "oemNumberNormalized" TEXT NOT NULL DEFAULT '';

-- Backfill: mevcut OEM numaralarını ayraçsız + küçük harf normalleştir
UPDATE "OemReference"
SET "oemNumberNormalized" = regexp_replace(lower("oemNumber"), '[^a-z0-9]', '', 'g');

-- CreateIndex
CREATE INDEX "OemReference_oemNumberNormalized_idx" ON "OemReference"("oemNumberNormalized");
