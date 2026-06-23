-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "discountPct" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "shippingCost" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "shippingMode" TEXT,
ADD COLUMN     "validUntil" TIMESTAMP(3),
ADD COLUMN     "vatRate" DECIMAL(5,2) DEFAULT 0;

-- AlterTable
ALTER TABLE "QuoteRequestItem" ADD COLUMN     "unitPrice" DECIMAL(12,2);
