-- CreateEnum
CREATE TYPE "SpecType" AS ENUM ('TEXT', 'SELECT', 'NUMBER', 'DIMENSION', 'RANGE');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showInMenu" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ProductSpec" ADD COLUMN     "attributeId" TEXT;

-- CreateTable
CREATE TABLE "CategorySpecAttribute" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SpecType" NOT NULL DEFAULT 'TEXT',
    "unit" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategorySpecAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategorySpecAttribute_categoryId_idx" ON "CategorySpecAttribute"("categoryId");

-- CreateIndex
CREATE INDEX "ProductSpec_attributeId_idx" ON "ProductSpec"("attributeId");

-- AddForeignKey
ALTER TABLE "CategorySpecAttribute" ADD CONSTRAINT "CategorySpecAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSpec" ADD CONSTRAINT "ProductSpec_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategorySpecAttribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
