-- CreateTable
CREATE TABLE "KitComponent" (
    "id" TEXT NOT NULL,
    "parentProductId" TEXT NOT NULL,
    "componentProductId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "dimension" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KitComponent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KitComponent_parentProductId_idx" ON "KitComponent"("parentProductId");

-- CreateIndex
CREATE INDEX "KitComponent_componentProductId_idx" ON "KitComponent"("componentProductId");

-- CreateIndex
CREATE UNIQUE INDEX "KitComponent_parentProductId_componentProductId_key" ON "KitComponent"("parentProductId", "componentProductId");

-- AddForeignKey
ALTER TABLE "KitComponent" ADD CONSTRAINT "KitComponent_parentProductId_fkey" FOREIGN KEY ("parentProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KitComponent" ADD CONSTRAINT "KitComponent_componentProductId_fkey" FOREIGN KEY ("componentProductId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
