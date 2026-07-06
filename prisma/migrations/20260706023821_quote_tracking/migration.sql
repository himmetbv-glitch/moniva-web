-- CreateEnum
CREATE TYPE "QuoteEventType" AS ENUM ('LINK_OPENED', 'DECISION_APPROVE', 'DECISION_REVISION', 'DECISION_CONTACT', 'DECISION_DECLINE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "QuoteStatus" ADD VALUE 'VIEWED';
ALTER TYPE "QuoteStatus" ADD VALUE 'APPROVED';
ALTER TYPE "QuoteStatus" ADD VALUE 'REVISION_REQUESTED';
ALTER TYPE "QuoteStatus" ADD VALUE 'DECLINED';
ALTER TYPE "QuoteStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "firstViewedAt" TIMESTAMP(3),
ADD COLUMN     "lastViewedAt" TIMESTAMP(3),
ADD COLUMN     "publicToken" TEXT,
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "QuoteEvent" (
    "id" TEXT NOT NULL,
    "quoteRequestId" TEXT NOT NULL,
    "type" "QuoteEventType" NOT NULL,
    "device" TEXT,
    "ipHash" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuoteEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteEvent_quoteRequestId_idx" ON "QuoteEvent"("quoteRequestId");

-- CreateIndex
CREATE INDEX "QuoteEvent_type_idx" ON "QuoteEvent"("type");

-- CreateIndex
CREATE INDEX "QuoteEvent_createdAt_idx" ON "QuoteEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteRequest_publicToken_key" ON "QuoteRequest"("publicToken");

-- AddForeignKey
ALTER TABLE "QuoteEvent" ADD CONSTRAINT "QuoteEvent_quoteRequestId_fkey" FOREIGN KEY ("quoteRequestId") REFERENCES "QuoteRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

