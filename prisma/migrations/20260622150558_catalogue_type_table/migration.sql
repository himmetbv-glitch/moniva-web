/*
  Warnings:

  - You are about to drop the column `type` on the `Catalogue` table. All the data in the column will be lost.
  - Added the required column `typeId` to the `Catalogue` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Catalogue_type_idx";

-- AlterTable
ALTER TABLE "Catalogue" DROP COLUMN "type",
ADD COLUMN     "typeId" TEXT NOT NULL;

-- DropEnum
DROP TYPE "CatalogueType";

-- CreateTable
CREATE TABLE "CatalogueType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4F3D8C',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogueType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogueType_slug_key" ON "CatalogueType"("slug");

-- CreateIndex
CREATE INDEX "CatalogueType_order_idx" ON "CatalogueType"("order");

-- CreateIndex
CREATE INDEX "Catalogue_typeId_idx" ON "Catalogue"("typeId");

-- AddForeignKey
ALTER TABLE "Catalogue" ADD CONSTRAINT "Catalogue_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "CatalogueType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
