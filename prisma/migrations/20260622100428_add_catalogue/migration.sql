-- CreateEnum
CREATE TYPE "CatalogueType" AS ENUM ('FULL', 'REFERENCE', 'FAMILY', 'BRAND');

-- CreateTable
CREATE TABLE "Catalogue" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "CatalogueType" NOT NULL DEFAULT 'FAMILY',
    "description" TEXT,
    "version" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pageCount" INTEGER,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "coverImage" TEXT,
    "status" "NewsStatus" NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Catalogue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Catalogue_slug_key" ON "Catalogue"("slug");

-- CreateIndex
CREATE INDEX "Catalogue_status_idx" ON "Catalogue"("status");

-- CreateIndex
CREATE INDEX "Catalogue_type_idx" ON "Catalogue"("type");

-- CreateIndex
CREATE INDEX "Catalogue_order_idx" ON "Catalogue"("order");
