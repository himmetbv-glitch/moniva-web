/*
  Warnings:

  - Added the required column `country` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kvkkConsent` to the `QuoteRequest` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `QuoteRequest` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PartType" AS ENUM ('OEM', 'AFTERMARKET');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "partType" "PartType" NOT NULL DEFAULT 'AFTERMARKET';

-- AlterTable
ALTER TABLE "QuoteRequest" ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "kvkkConsent" BOOLEAN NOT NULL,
ADD COLUMN     "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "taxNumber" DROP NOT NULL,
ALTER COLUMN "address" SET NOT NULL;
