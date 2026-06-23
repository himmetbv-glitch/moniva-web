-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "QuoteRequest_isArchived_idx" ON "QuoteRequest"("isArchived");
